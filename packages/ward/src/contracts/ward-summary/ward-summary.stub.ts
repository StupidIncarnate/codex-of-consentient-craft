import { wardSummaryContract, type WardSummary } from './ward-summary-contract';

export const WardSummaryStub = ({ value }: { value?: string } = {}): WardSummary =>
  wardSummaryContract.parse(value ?? 'run: 1739625600000-a3f1\nlint:      PASS  1 packages');
