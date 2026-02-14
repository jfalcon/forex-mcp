#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { DuckDBInstance } from '@duckdb/node-api';
import pkg from '../package.json' with { type: 'json' };
import 'dotenv/config';

/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
const CYAN   = '\x1b[1;36m';
const GRAY   = '\x1b[0;90m';
const GREEN  = '\x1b[1;32m';
const NC     = '\x1b[0m';
const RED    = '\x1b[0;31m';
const YELLOW = '\x1b[1;33m';
/* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars */

const DATA_PATH = path.resolve(import.meta.dirname, '..', 'data');
const DIST_PATH = path.dirname(path.resolve(import.meta.dirname, '..', pkg.bin.fcp));

const DB_PATH = process.env.DB_PATH ?? null;
const DB_FILE = path.join(DB_PATH ?? DIST_PATH, 'forex.duckdb');

const pairs = ['eurusd'];

// Init ////////////////////////////////////////////////////////////////////////////////////////////

if (process.getuid && process.getuid() === 0) {
  console.error(`${RED}Please run this script without elevated privileges.${NC}`);
  process.exit(1);
}

// Utils ///////////////////////////////////////////////////////////////////////////////////////////

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function pressAnyKey() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    resolve();
  }));
}

// Entry ///////////////////////////////////////////////////////////////////////////////////////////

console.info(`This script builds the ${GREEN}DuckDB + Parquet${NC} database.`);

(async () => {
  process.stdout.write('Press any key to continue . . .');
  await pressAnyKey();
  console.info();

  // scan for CSV files before creating the database
  const csvFiles = fs.readdirSync(DATA_PATH).filter(f =>
    pairs.some(pair => new RegExp(`^${pair}_m1_\\d{4}\\.csv$`, 'i').test(f)),
  );

  if (csvFiles.length === 0) {
    console.error(`${RED}No CSV files found. Aborting DB creation.${NC}`);
    process.exit(1);
  }

  console.info(
    `Found ${GREEN}${csvFiles.length}${NC} CSV file${csvFiles.length === 1 ? '' : 's'}.`,
    'Creating or updating database...',
  );

  // now it's safe to create a database instance and connection
  ensureDir(DIST_PATH);

  const instance = await DuckDBInstance.create(DB_FILE);
  const conn = await instance.connect();

  try {
    for (const pair of pairs) {
      const table = pair.toUpperCase();
      const parquetFile = path.join(DIST_PATH, `${pair}_m1.parquet`);
      const globPath = path.join(DATA_PATH, `${pair}_m1_*.csv`).replace(/\\/g, '\\\\');

      console.info(`Loading CSVs into DuckDB for ${GREEN}${table}${NC}...`);

      // create or replace table, also deduplicate and sort
      await conn.run(`
        CREATE OR REPLACE TABLE ${table} AS
        SELECT *
        FROM read_csv_auto(
            '${globPath}',
            HEADER=TRUE,
            COLUMN_NAMES=['date','time','open','high','low','close','volume']
        ) AS t
        QUALIFY ROW_NUMBER() OVER (PARTITION BY t.date, t.time ORDER BY t.date, t.time) = 1
      `);

      // add timestamp column
      await conn.run(`
        ALTER TABLE ${table}
        ADD COLUMN IF NOT EXISTS ts TIMESTAMP;
      `);

      await conn.run(`
        UPDATE ${table}
        SET ts = CAST(date || ' ' || time AS TIMESTAMP);
      `);

      // create indexes
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_${pair}_ts ON ${table}(ts);`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_${pair}_date_time ON ${table}(date, time);`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_${pair}_close ON ${table}(close);`);

      console.info(`DuckDB ${GREEN}${table}${NC} table rebuilt successfully.`);

      // write Parquet file
      await conn.run(`
        COPY (
          SELECT * FROM ${table} ORDER BY ts
        ) TO '${parquetFile.replace(/\\/g, '\\\\')}'
        (FORMAT PARQUET, COMPRESSION ZSTD);
      `);

      console.info(`Parquet file written for ${GREEN}${table}${NC}.`);
    }

  } catch (err) {
    console.error(`${RED}Import failed:${NC}`, err);
    conn.closeSync();
    process.exit(1);
  }

  conn.closeSync();
  console.info('Closed DuckDB connection.');
})();
