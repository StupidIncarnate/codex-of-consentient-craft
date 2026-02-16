import { checkStatusContract } from './check-status-contract';
import type { CheckStatus } from './check-status-contract';

export const CheckStatusStub = ({ value }: { value?: string } = {}): CheckStatus =>
  checkStatusContract.parse(value ?? 'pass');
