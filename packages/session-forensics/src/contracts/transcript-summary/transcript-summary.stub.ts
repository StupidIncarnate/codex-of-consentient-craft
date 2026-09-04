import { transcriptSummaryContract, type TranscriptSummary } from './transcript-summary-contract';
import { TokenUsageStub } from '../token-usage/token-usage.stub';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TranscriptSummaryStub = ({
  ...props
}: StubArgument<TranscriptSummary> = {}): TranscriptSummary =>
  transcriptSummaryContract.parse({
    recordCount: 412,
    apiResponseCount: 96,
    startedAt: '2026-08-01T10:00:00.000Z',
    endedAt: '2026-08-01T11:30:00.000Z',
    wallClockSeconds: 5400,
    models: { 'claude-opus-5': 60, 'claude-sonnet-5': 36 },
    recordTypeCounts: { assistant: 96, user: 96 },
    toolCallCounts: { Read: 40, Edit: 12 },
    toolResultBytes: 204_800,
    subagentCount: 3,
    usage: TokenUsageStub(),
    ...props,
  });
