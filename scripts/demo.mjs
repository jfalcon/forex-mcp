#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
const CYAN = '\x1b[1;36m';    // light cyan
const GRAY = '\x1b[0;90m';    // dark gray
const GREEN = '\x1b[1;32m';   // light green
const NC = '\x1b[0m';         // default color
const RED = '\x1b[0;31m';     // red
const YELLOW = '\x1b[1;33m';  // yellow
/* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars */

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'data');
const ZIP_FILE = 'eurusd_m1.zip';
const ZIP_PAIR = 'EUR/USD';
const ZIP_PATH = path.join(os.tmpdir(), ZIP_FILE);
const ZIP_URL = `https://github.com/jfalcon/forex-mcp/releases/download/v0.1.0/${ZIP_FILE}`;

// Init ////////////////////////////////////////////////////////////////////////////////////////////

if (process.getuid && process.getuid() === 0) {
  console.error(`${RED}Please run this script without elevated privileges.${NC}`);
  process.exit(1);
}

for (const cmd of ['curl', 'unzip']) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
  } catch {
    console.error(`${RED}The command "${cmd}" is required to run this script.${NC}`);
    process.exit(1);
  }
}

// Routines ////////////////////////////////////////////////////////////////////////////////////////

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function pressAnyKey() {
  // wait for a single keypress without echoing
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    resolve();
  }));
}

// Entry ///////////////////////////////////////////////////////////////////////////////////////////

console.info(`This script will download demo ${GREEN}${ZIP_PAIR}${NC} data.`);

(async () => {
  process.stdout.write('Press any key to continue . . .');
  await pressAnyKey();
  console.info(); // newline after keypress

  ensureDir(DATA_DIR);

  console.info('Downloading ZIP');
  execSync(`curl -L "${ZIP_URL}" -o "${ZIP_PATH}"`, { stdio: 'inherit' });

  console.info('Extracting...');
  execSync(`unzip -q -o "${ZIP_PATH}" -d "${DATA_DIR}"`, { stdio: 'inherit' });

  try {
    fs.rmSync(ZIP_PATH, { force: true });
  } catch {
    // ignore cleanup errors
  }

  console.info(`Done! Files extracted to: ${CYAN}${DATA_DIR}${NC}`);
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
