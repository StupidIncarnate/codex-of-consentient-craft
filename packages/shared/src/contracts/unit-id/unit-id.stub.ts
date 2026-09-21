import { unitIdContract } from './unit-id-contract';
import type { UnitId } from './unit-id-contract';

export const UnitIdStub = (
  { value }: { value: string } = { value: 'send-flow:observable:check-badge-count-text' },
): UnitId => unitIdContract.parse(value);
