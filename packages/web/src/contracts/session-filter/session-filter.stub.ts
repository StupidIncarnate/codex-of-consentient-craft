import { sessionFilterContract } from './session-filter-contract';
import type { SessionFilter } from './session-filter-contract';

export const SessionFilterStub = ({ value }: { value?: string } = {}): SessionFilter =>
  sessionFilterContract.parse(value ?? 'all');
