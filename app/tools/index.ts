// allow barrel-like imports since the idea is the server will
// include all tools defined in this directory anyway
import { calculateEmaTool } from './ema';

export default [
  calculateEmaTool(),
];
