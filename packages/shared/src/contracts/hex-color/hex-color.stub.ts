/**
 * PURPOSE: Stub factory for HexColor branded string type
 *
 * USAGE:
 * const color = HexColorStub({ value: '#ff6b35' });
 * // Returns branded HexColor string
 */
import { hexColorContract, type HexColor } from './hex-color-contract';

export const HexColorStub = ({ value }: { value: string } = { value: '#ff6b35' }): HexColor =>
  hexColorContract.parse(value);
