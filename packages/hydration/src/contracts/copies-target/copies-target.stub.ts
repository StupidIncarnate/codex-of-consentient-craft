import { copiesTargetContract } from './copies-target-contract';
import type { CopiesTarget } from './copies-target-contract';

export const CopiesTargetStub = (
  { value }: { value: string } = { value: 'questPersistBroker' },
): CopiesTarget => copiesTargetContract.parse(value);
