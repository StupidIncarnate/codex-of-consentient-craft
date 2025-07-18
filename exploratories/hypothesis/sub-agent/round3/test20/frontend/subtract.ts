/**
 * Subtract function for calculator library
 * @param a - First number (minuend)
 * @param b - Second number (subtrahend)
 * @returns Difference of a and b
 * @throws Error if inputs are not numbers
 */
export function subtract(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Both arguments must be finite numbers');
  }
  
  return a - b;
}