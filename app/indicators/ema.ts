import { EMA } from 'technicalindicators';

/**
 * Calculates the Exponential Moving Average (EMA) for a given array of prices.
 * @param period - The window size (e.g., 20, 50, 200)
 * @param prices - Array of closing prices
 * @returns Array of EMA values (length will be prices.length - period + 1)
 */
export function ema(period: number, prices: number[]): number[] {
  if (period <= 0) {
    throw new Error('Invalid period: EMA period must be greater than 0.');
  }

  if (prices.length < period) {
    throw new Error(
      `Insufficient data: EMA(${period}) requires at least ${period} data ` +
      `points, but received ${prices.length}.`,
    );
  }

  return EMA.calculate({
    period,
    values: prices,
  });
}
