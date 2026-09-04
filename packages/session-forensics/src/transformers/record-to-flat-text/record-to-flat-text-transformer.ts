/**
 * PURPOSE: A turn's readable prose is split across `text` and `thinking` content blocks whose lengths
 * differ by orders of magnitude, so a timeline that prints one line per turn needs a single place that
 * flattens both into one string while bounding thinking so one turn's chain-of-thought cannot swamp the
 * digest.
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
