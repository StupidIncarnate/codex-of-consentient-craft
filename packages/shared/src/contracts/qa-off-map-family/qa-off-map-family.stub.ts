import { qaOffMapFamilyContract } from './qa-off-map-family-contract';
import type { QaOffMapFamily } from './qa-off-map-family-contract';

export const QaOffMapFamilyStub = (
  { value }: { value: string } = { value: 'concurrency' },
): QaOffMapFamily => qaOffMapFamilyContract.parse(value);
