/**
 * PURPOSE: Stub factory for CompletedCount branded number type
 *
 * USAGE:
 * const completed = CompletedCountStub({ value: 5 });
 * // Returns branded CompletedCount number
 */
import { completedCountContract, type CompletedCount } from './completed-count-contract';

export const CompletedCountStub = ({ value }: { value?: number } = {}): CompletedCount =>
  completedCountContract.parse(value ?? 3);
