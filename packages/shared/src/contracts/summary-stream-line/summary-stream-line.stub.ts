import type { StubArgument } from '../../@types/stub-argument.type';

import { summaryStreamLineContract } from './summary-stream-line-contract';
import type { SummaryStreamLine } from './summary-stream-line-contract';

export const SummaryStreamLineStub = ({
  ...props
}: StubArgument<SummaryStreamLine> = {}): SummaryStreamLine =>
  summaryStreamLineContract.parse({
    type: 'summary',
    summary: 'Built login flow with OAuth',
    ...props,
  });
