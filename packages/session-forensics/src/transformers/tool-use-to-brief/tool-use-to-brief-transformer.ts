/**
 * PURPOSE: Reduces a tool_use content block's free-form `input` to a one-line brief. A forensics
 * timeline can print that brief without one call making the whole line unreadable. Tool inputs vary
 * wildly from tool to tool, so this transformer prints only the handful of keys that actually
 * explain what a call did, in a fixed priority order. It falls back to printing the whole input
 * when none of those keys are present.
 *
 * USAGE:
 * toolUseToBriefTransformer({ block: { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } } });
 * // Returns { name: 'Read', brief: 'file_path=/tmp/x.ts' }
 */
import { toolBriefContract, type ToolBrief } from '../../contracts/tool-brief/tool-brief-contract';
import { toolBriefKeyStatics } from '../../statics/tool-brief-key/tool-brief-key-statics';
import { digestDefaultStatics } from '../../statics/digest-default/digest-default-statics';
import type { TranscriptRecordContentBlock } from '../../contracts/transcript-record-content-block/transcript-record-content-block-contract';

export const toolUseToBriefTransformer = ({
  block,
  maxChars = digestDefaultStatics.maxTextChars,
}: {
  block: TranscriptRecordContentBlock;
  maxChars?: number;
}): ToolBrief => {
  const name = block.name ?? '?';
  const { input } = block;

  if (input === undefined) {
    return toolBriefContract.parse({ name, brief: '' });
  }

  const renderedPairs = toolBriefKeyStatics.interestingKeys
    .filter((key): boolean => input[key] !== undefined)
    .map((key) => {
      const raw = input[key];
      const stringValue = typeof raw === 'string' ? raw : JSON.stringify(raw);
      return `${key}=${stringValue.replace(/\s+/gu, ' ').slice(0, maxChars)}`;
    });

  const brief =
    renderedPairs.length > 0
      ? renderedPairs.join(' ')
      : JSON.stringify(input).replace(/\s+/gu, ' ').slice(0, maxChars);

  return toolBriefContract.parse({ name, brief });
};
