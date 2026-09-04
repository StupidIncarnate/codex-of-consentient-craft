/**
 * PURPOSE: The `summary` CLI command needs a fixed block of prose on a terminal, not a
 * `TranscriptSummary` object that each caller reformats for itself. This transformer is the one
 * place that renders it. Every consumer then sees the same units and the same thousands
 * separators. Every consumer also sees the same wording for the two numbers people misread most.
 * One model reply covers several lines of the transcript. Cache reads and cache writes are priced
 * differently, so they are counted apart.
 *
 * USAGE:
 * summaryToTextTransformer({ summary: TranscriptSummaryStub() });
 * // Returns a ContentText: a header block of session facts, a token block, a tool-call histogram,
 * // then the tool-result byte count and the sub-agent count
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import type { TranscriptSummary } from '../../contracts/transcript-summary/transcript-summary-contract';

const LABEL_WIDTH = 25;
const TOKEN_LABEL_WIDTH = 25;
const TOOL_COUNT_WIDTH = 5;
const SECONDS_PER_MINUTE = 60;

export const summaryToTextTransformer = ({
  summary,
}: {
  summary: TranscriptSummary;
}): ContentText => {
  const startLine =
    summary.startedAt === undefined
      ? `${'Session started'.padEnd(LABEL_WIDTH)}(nothing in the file was timestamped)`
      : `${'Session started'.padEnd(LABEL_WIDTH)}${summary.startedAt}`;

  const endLines =
    summary.endedAt === undefined
      ? []
      : [`${'Session ended'.padEnd(LABEL_WIDTH)}${summary.endedAt}`];

  const wallLines =
    summary.wallClockSeconds === undefined
      ? []
      : [
          `${'Ran for'.padEnd(LABEL_WIDTH)}${(summary.wallClockSeconds / SECONDS_PER_MINUTE).toFixed(1)} minutes`,
        ];

  const modelsLine = `${'Models used'.padEnd(LABEL_WIDTH)}${Object.entries(summary.models)
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
    .map(([name, count]) => `${name}x${count.toLocaleString('en-US')}`)
    .join(', ')}`;

  const headerBlock = [
    `${'Lines in the transcript'.padEnd(LABEL_WIDTH)}${summary.recordCount.toLocaleString('en-US')}`,
    `${'Times the model replied'.padEnd(LABEL_WIDTH)}${summary.apiResponseCount.toLocaleString('en-US')} (one reply covers several lines of the transcript)`,
    startLine,
    ...endLines,
    ...wallLines,
    modelsLine,
  ].join('\n');

  const totalContextIn =
    summary.usage.inputTokens + summary.usage.cacheReadTokens + summary.usage.cacheCreationTokens;

  const tokensBlock = [
    'Tokens for this session only. Sub-agents are counted separately.',
    'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
    `  ${'Fed in, not cached'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.inputTokens.toLocaleString('en-US')}`,
    `  ${'Fed in, read from cache'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.cacheReadTokens.toLocaleString('en-US')}`,
    `  ${'Fed in, written to cache'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.cacheCreationTokens.toLocaleString('en-US')}`,
    `  ${'Written out by the model'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.outputTokens.toLocaleString('en-US')}`,
    `  ${'Of that output, thinking'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.thinkingTokens.toLocaleString('en-US')}`,
    `  ${'Total fed into the model'.padEnd(TOKEN_LABEL_WIDTH)}: ${totalContextIn.toLocaleString('en-US')}`,
  ].join('\n');

  const toolCallEntries = Object.entries(summary.toolCallCounts).sort(
    ([nameA, countA], [nameB, countB]) =>
      countA === countB ? nameA.localeCompare(nameB) : countB - countA,
  );
  const toolCallTotal = toolCallEntries.reduce((sum, [, count]) => sum + count, 0);

  const toolCallsBlock = [
    `Tool calls the model made (${toolCallTotal.toLocaleString('en-US')} in total)`,
    ...toolCallEntries.map(
      ([name, count]) => `  ${count.toLocaleString('en-US').padStart(TOOL_COUNT_WIDTH)}  ${name}`,
    ),
  ].join('\n');

  const footerBlock = [
    `${'Bytes returned by tools'.padEnd(LABEL_WIDTH)}${summary.toolResultBytes.toLocaleString('en-US')}`,
    `${'Sub-agents started'.padEnd(LABEL_WIDTH)}${summary.subagentCount.toLocaleString('en-US')}`,
  ].join('\n');

  return contentTextContract.parse(
    [headerBlock, tokensBlock, toolCallsBlock, footerBlock].join('\n\n'),
  );
};
