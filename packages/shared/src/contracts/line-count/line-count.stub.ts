/**
 * PURPOSE: Stub factory for LineCount branded number type
 *
 * USAGE:
 * const lines = LineCountStub({ value: 500 });
 * // Returns branded LineCount number
 */
import { lineCountContract, type LineCount } from './line-count-contract';

export const LineCountStub = ({ value }: { value: number } = { value: 500 }): LineCount =>
  lineCountContract.parse(value);
