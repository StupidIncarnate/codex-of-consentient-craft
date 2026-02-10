import { attemptCountContract } from './attempt-count-contract';
import type { AttemptCount } from './attempt-count-contract';

export const AttemptCountStub = ({ value }: { value: number } = { value: 0 }): AttemptCount =>
  attemptCountContract.parse(value);
