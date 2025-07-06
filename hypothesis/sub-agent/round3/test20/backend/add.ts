/**
 * Add function for calculator library
 * @param a - First number
 * @param b - Second number
 * @returns Sum of a and b
 * @throws Error if inputs are not numbers
 */
export function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Both arguments must be finite numbers');
  }
  
  return a + b;
}