import { occurrenceThresholdContract } from './occurrence-threshold-contract';
import type { OccurrenceThreshold } from './occurrence-threshold-contract';

export const OccurrenceThresholdStub = (
  { value }: { value: number } = { value: 3 },
): OccurrenceThreshold => occurrenceThresholdContract.parse(value);
