export interface Candle {
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
