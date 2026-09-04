/**
 * PURPOSE: Claude Code writes an assistant turn's `message.content` as an array of typed blocks. It
 * writes a user or injected-prompt turn's `message.content` as a bare string instead. This
 * transformer is the one place that folds that bare string into a single-element block array. Every
 * downstream consumer can then branch on block type alone, never on the shape of `content` itself.
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
