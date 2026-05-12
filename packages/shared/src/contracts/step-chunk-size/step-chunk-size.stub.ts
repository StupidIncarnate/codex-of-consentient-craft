/**
 * PURPOSE: Stub factory for StepChunkSize branded number type
 *
 * USAGE:
 * const cap = StepChunkSizeStub({ value: 6 });
 * // Returns branded StepChunkSize number
 */
import { stepChunkSizeContract, type StepChunkSize } from './step-chunk-size-contract';

export const StepChunkSizeStub = ({ value }: { value: number } = { value: 6 }): StepChunkSize =>
  stepChunkSizeContract.parse(value);
