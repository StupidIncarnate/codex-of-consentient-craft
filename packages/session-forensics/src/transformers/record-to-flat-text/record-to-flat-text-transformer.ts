/**
 * PURPOSE: A turn's readable prose is split across `text` and `thinking` content blocks. Their
 * lengths differ by orders of magnitude. A timeline that prints one line per turn needs a single
 * place that flattens both kinds of block into one string. This transformer is that place. It also
 * bounds how much of `thinking` it keeps, so one turn's chain-of-thought cannot swamp the digest.
 *
 * USAGE:
 * recordToFlatTextTransformer({ record: TranscriptRecordStub({ message: { content: 'hi' } }) });
 * // Returns ContentText 'hi'
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { recordToContentBlocksTransformer } from '../record-to-content-blocks/record-to-content-blocks-transformer';
import { digestDefaultStatics } from '../../statics/digest-default/digest-default-statics';
import type { TranscriptRecord } from '../../contracts/transcript-record/transcript-record-contract';

export const recordToFlatTextTransformer = ({
  record,
  thinkingChars = digestDefaultStatics.thinkingExcerptChars,
}: {
  record: TranscriptRecord;
  thinkingChars?: number;
}): ContentText => {
  const blocks = recordToContentBlocksTransformer({ record });

  const pieces = blocks.flatMap((block) => {
    if (block.type === 'text') {
      return block.text === undefined ? [] : [block.text];
    }

    if (block.type === 'thinking') {
      return block.thinking === undefined
        ? []
        : [`[thinking] ${block.thinking.slice(0, thinkingChars)}`];
    }

    return [];
  });

  return contentTextContract.parse(pieces.join('\n'));
};
