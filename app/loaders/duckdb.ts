import fs from 'node:fs';
import path from 'node:path';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import type { Candle } from '@/types/candle';

// singleton instance for reuse (avoids recreating DB per call)
let instance: DuckDBInstance | null = null;

export function closeConnection(): void {
  if (instance) {
    instance.closeSync();
    instance = null;
  }
}

export async function getConnection(): Promise<DuckDBConnection> {
  if (!instance) await getInstance();

  const connection = await instance!.connect();

  // install and load Parquet extension (only needs to run once per instance, but safe to repeat)
  await connection.run('INSTALL parquet;');
  await connection.run('LOAD parquet;');

  return connection;
}

export async function getInstance(): Promise<DuckDBInstance | null> {
  if (!instance) {
    const filePath = process.env.DB_PATH
      ? path.join(process.env.DB_PATH, 'forex.duckdb')
      : null;

    // do not use an in-memory database
    if (filePath && fs.existsSync(filePath)) {
      instance = await DuckDBInstance.create(filePath);
    }
  }

  return instance;
}

export function getParquetFile(symbol: string, timeframe: string): string | null {
  const safeSymbol = symbol.toLowerCase().replace(/[^a-z]/g, '');
  const safeTimeframe = timeframe.toLowerCase().replace(/[^a-z0-9]/g, '');

  return process.env.DB_PATH
    ? path.join(process.env.DB_PATH, `${safeSymbol}_${safeTimeframe}.parquet`)
    : null;
}

export async function* loadCandles(
  pair: string,
  tf: string,
  start: string,
  end: string,
): AsyncGenerator<Candle> {
  const parquetFile = getParquetFile(pair, tf);

  if (!parquetFile) {
    throw new Error(`No parquet file found for ${pair} ${tf}`);
  }

  const conn = await getConnection();
  const startTs = new Date(start).getTime();
  const endTs = new Date(end).getTime();

  const query = `
    SELECT date, time, open, high, low, close, volume, ts
    FROM read_parquet('${parquetFile}')
    WHERE ts >= epoch_ms(${startTs}) AND ts <= epoch_ms(${endTs})
    ORDER BY ts ASC
  `;

  // execute as a streaming query
  const result = await conn.stream(query);
  const columnNames = result.deduplicatedColumnNames();

  while (true) {
    const chunk = await result.fetchChunk();

    if (chunk?.rowCount === 0) break;
    const rows = chunk?.getRowObjects(columnNames);

    if (rows) {
      for (const row of rows) {
        yield {
          date: row.date?.valueOf()?.toString() ?? '',
          time: row.time?.valueOf()?.toString() ?? '',
          open: Number(row.open?.valueOf() ?? 0),
          high: Number(row.high?.valueOf() ?? 0),
          low: Number(row.low?.valueOf() ?? 0),
          close: Number(row.close?.valueOf() ?? 0),
          volume: Number(row.volume?.valueOf() ?? 0),
        };
      }
    }
  }
}
