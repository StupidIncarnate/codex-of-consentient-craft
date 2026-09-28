import { transcriptRecordUsageKeyContract } from './transcript-record-usage-key-contract';
import type { TranscriptRecordUsageKey } from './transcript-record-usage-key-contract';

export const TranscriptRecordUsageKeyStub = (
  { value }: { value: string } = { value: 'input_tokens' },
): TranscriptRecordUsageKey => transcriptRecordUsageKeyContract.parse(value);
