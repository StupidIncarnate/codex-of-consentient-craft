import type { StubArgument } from '@dungeonmaster/shared/@types';

import { transcriptRecordUsageContract } from './transcript-record-usage-contract';
import type { TranscriptRecordUsage } from './transcript-record-usage-contract';

export const TranscriptRecordUsageStub = ({
  ...props
}: StubArgument<TranscriptRecordUsage> = {}): TranscriptRecordUsage =>
  transcriptRecordUsageContract.parse({
    input_tokens: 2,
    output_tokens: 239,
    ...props,
  });
