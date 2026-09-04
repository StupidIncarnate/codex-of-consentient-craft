/**
 * PURPOSE: Claude Code writes an assistant turn's `message.content` as an array of typed blocks but a
 * user/injected-prompt turn's as a bare string. This is the one place that folds the bare string into a
 * single-element block array so every downstream consumer branches on block type once, never on the
 * shape of `content` itself.
 *
 * USAGE:
 * recordToContentBlocksTransformer({ record: TranscriptRecordStub({ message: { content: 'hi' } }) });
 * // Returns [{ type: 'text', text: 'hi' }]
 */
import {
  transcriptRecordContentBlockContract,
  type TranscriptRecordContentBlock,
} from '../../contracts/transcript-record-content-block/transcript-record-content-block-contract';
import type { TranscriptRecord } from '../../contracts/transcript-record/transcript-record-contract';

export const recordToContentBlocksTransformer = ({
  record,
}: {
  record: TranscriptRecord;
}): readonly TranscriptRecordContentBlock[] => {
  const content = record.message?.content;

  if (content === undefined) {
    return [];
  }

  if (typeof content === 'string') {
    return [transcriptRecordContentBlockContract.parse({ type: 'text', text: content })];
  }

  return content;
};
