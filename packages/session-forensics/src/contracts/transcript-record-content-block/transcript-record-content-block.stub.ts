import {
  transcriptRecordContentBlockContract,
  type TranscriptRecordContentBlock,
} from './transcript-record-content-block-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TranscriptRecordContentBlockStub = ({
  ...props
}: StubArgument<TranscriptRecordContentBlock> = {}): TranscriptRecordContentBlock =>
  transcriptRecordContentBlockContract.parse({
    type: 'text',
    text: 'Reading the file now.',
    ...props,
  });
