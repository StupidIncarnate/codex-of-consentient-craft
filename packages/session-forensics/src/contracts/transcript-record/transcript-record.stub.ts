import { transcriptRecordContract, type TranscriptRecord } from './transcript-record-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TranscriptRecordStub = ({
  ...props
}: StubArgument<TranscriptRecord> = {}): TranscriptRecord =>
  transcriptRecordContract.parse({
    type: 'assistant',
    timestamp: '2026-09-01T19:09:06.542Z',
    message: {
      model: 'claude-opus-5',
      content: [{ type: 'text', text: 'Hello world' }],
    },
    ...props,
  });
