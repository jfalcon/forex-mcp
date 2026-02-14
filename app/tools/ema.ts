import { z } from 'zod/v4';
import { ema } from '@/indicators/ema';
import type { ToolDefinition } from '@/types/tool';

const inputSchema = z.object({
  closes: z.array(z.number()).describe('List of closing prices (oldest to newest)'),
  period: z.number().describe('The EMA period (e.g., 14, 20, 50)'),
});

const outputSchema = z.object({
  period: z.number(),
  latestValue: z.number().describe('The most recent EMA value'),
  history: z.array(z.number()).describe('The past EMA values excluding the latest value'),
}).describe('Calculated EMA data');

export function calculateEmaTool(): ToolDefinition<typeof outputSchema, typeof inputSchema> {
  return ({
    name: 'calculate_ema',
    config: {
      title: 'Calculate EMA',
      description: 'Calculate the Exponential Moving Average (EMA) on OHLCV data',
      inputSchema,
      outputSchema,
    },
    handler: async ({ closes, period }) => {
      try {
        const results = ema(period, closes);

        const structuredContent = {
          period,
          latestValue: results[results.length - 1],
          history: results.slice(0, results.length - 1),
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(structuredContent),
          }],
          structuredContent,
        };
      } catch (error) {
        const message = (error instanceof Error) ? error.message : String(error);

        return {
          isError: true,
          content: [{ type: 'text', text: message }],
        };
      }
    },
  });
}
