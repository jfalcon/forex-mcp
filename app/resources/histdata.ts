import { EOL } from 'node:os';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { loadCandles } from '@/loaders/duckdb';

export function registerHistDataResource(server: McpServer) {
  server.registerResource(
    'histdata',
    new ResourceTemplate('forex://histdata/{pair}/{tf}/{start}/{end}', {
      list: async () => ({
        resources: [
          {
            uri: 'forex://histdata/EURUSD/m1/2024-01-01/2024-01-02',
            name: 'Example Forex Data',
          },
        ],
      }),
    }),
    {
      title: 'Forex Historical Data',
      description: 'Immutable OHLCV historical FX spot market data',
      mimeType: 'application/json',
    },
    async (uri: URL, params): Promise<ReadResourceResult> => {
      // in the real world these would be validated and sanitized
      const pair = Array.isArray(params.pair) ? params.pair[0] : params.pair; // e.g. "EURUSD"
      const tf = Array.isArray(params.tf) ? params.tf[0] : params.tf; // e.g. "m1", "m5", "h1", "d1"
      const start = Array.isArray(params.start) ? params.start[0] : params.start; // e.g. "2024-01-01"
      const end = Array.isArray(params.end) ? params.end[0] : params.end; // e.g. "2024-01-02"

      if (!pair || !tf || !start || !end) {
        throw new Error(
          'Missing required query parameters. Expected pair, tf, start, and end. ' +
          `Received URI: ${uri.toString()}`,
        );
      }

      // TODO: eventually support real streaming, in the meantime use NDJSON
      let candles = '';
      for await (const candle of loadCandles(pair, tf, start, end)) {
        candles += JSON.stringify(candle) + EOL;
      }

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: 'application/x-ndjson',
            text: candles,
          },
        ],
      };
    },
  );
}
