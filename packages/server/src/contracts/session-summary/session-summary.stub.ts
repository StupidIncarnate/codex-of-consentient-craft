import { sessionSummaryContract } from './session-summary-contract';
import type { SessionSummary } from './session-summary-contract';

export const SessionSummaryStub = ({ value }: { value?: string } = {}): SessionSummary =>
  sessionSummaryContract.parse(value ?? 'Built login page with OAuth');
