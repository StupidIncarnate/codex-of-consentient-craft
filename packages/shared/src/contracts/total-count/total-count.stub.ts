/**
 * PURPOSE: Stub factory for TotalCount branded number type
 *
 * USAGE:
 * const total = TotalCountStub({ value: 10 });
 * // Returns branded TotalCount number
 */
import { totalCountContract, type TotalCount } from './total-count-contract';

export const TotalCountStub = ({ value }: { value?: number } = {}): TotalCount =>
  totalCountContract.parse(value ?? 8);
