import { transcriptRecordToolInputKeyContract } from './transcript-record-tool-input-key-contract';
import type { TranscriptRecordToolInputKey } from './transcript-record-tool-input-key-contract';

export const TranscriptRecordToolInputKeyStub = (
  { value }: { value: string } = { value: 'file_path' },
): TranscriptRecordToolInputKey => transcriptRecordToolInputKeyContract.parse(value);
