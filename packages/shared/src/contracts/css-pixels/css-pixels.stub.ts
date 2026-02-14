/**
 * PURPOSE: Stub factory for CssPixels branded number type
 *
 * USAGE:
 * const px = CssPixelsStub({ value: 16 });
 * // Returns branded CssPixels number
 */
import { cssPixelsContract, type CssPixels } from './css-pixels-contract';

export const CssPixelsStub = ({ value }: { value: number } = { value: 16 }): CssPixels =>
  cssPixelsContract.parse(value);
