import { summaryLineContract, type SummaryLine } from './summary-line-contract';

export const SummaryLineStub = ({ value }: { value?: string } = {}): SummaryLine =>
  summaryLineContract.parse(value ?? 'Expected true to be false');
