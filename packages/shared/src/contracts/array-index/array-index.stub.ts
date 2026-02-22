/**
 * PURPOSE: Stub factory for ArrayIndex branded number type
 *
 * USAGE:
 * const idx = ArrayIndexStub({ value: 0 });
 * // Returns branded ArrayIndex number
 */
import { arrayIndexContract, type ArrayIndex } from './array-index-contract';

export const ArrayIndexStub = ({ value }: { value: number } = { value: 0 }): ArrayIndex =>
  arrayIndexContract.parse(value);
