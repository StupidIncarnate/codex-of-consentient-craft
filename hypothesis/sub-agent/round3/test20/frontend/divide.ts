/**
 * Divide function for calculator library
 * @param a - First number (dividend)
 * @param b - Second number (divisor)
 * @returns Quotient of a and b
 * @throws Error if inputs are not numbers or if dividing by zero
 */
export function divide(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Both arguments must be finite numbers');
  }
  
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  
  return a / b;
}