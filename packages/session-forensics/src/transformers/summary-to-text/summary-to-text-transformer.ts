/**
 * PURPOSE: The `summary` CLI command needs a fixed block of prose on a terminal, not a
 * `TranscriptSummary` object each caller reformats for itself — this is the one place that renders
 * it, so every consumer sees the same units, the same thousands separators, and the same "one API
 * response spans several transcript lines" caveat next to the number people misread most.
 *
 * USAGE:
 * summaryToTextTransformer({ summary: TranscriptSummaryStub() });
 * // Returns a ContentText: LINES/API CALLS/START[/END/WALL]/MODELS, a TOKENS block, a TOOL CALLS
 * // histogram, then TOOL RESULT BYTES and SUBAGENTS
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import type { TranscriptSummary } from '../../contracts/transcript-summary/transcript-summary-contract';

const LABEL_WIDTH = 10;
const TOKEN_LABEL_WIDTH = 18;
const TOOL_COUNT_WIDTH = 5;
const SECONDS_PER_MINUTE = 60;

export const summaryToTextTransformer = ({
  summary,
}: {
  summary: TranscriptSummary;
}): ContentText => {
  const startLine =
    summary.startedAt === undefined
      ? `${'START'.padEnd(LABEL_WIDTH)}(no timestamped record)`
      : `${'START'.padEnd(LABEL_WIDTH)}${summary.startedAt}`;

  const endLines =
    summary.endedAt === undefined ? [] : [`${'END'.padEnd(LABEL_WIDTH)}${summary.endedAt}`];

  const wallLines =
    summary.wallClockSeconds === undefined
      ? []
      : [
          `${'WALL'.padEnd(LABEL_WIDTH)}${(summary.wallClockSeconds / SECONDS_PER_MINUTE).toFixed(1)} min`,
        ];

  const modelsLine = `${'MODELS'.padEnd(LABEL_WIDTH)}${Object.entries(summary.models)
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
    .map(([name, count]) => `${name}x${count.toLocaleString('en-US')}`)
    .join(', ')}`;

  const headerBlock = [
    `${'LINES'.padEnd(LABEL_WIDTH)}${summary.recordCount.toLocaleString('en-US')}`,
    `${'API CALLS'.padEnd(LABEL_WIDTH)}${summary.apiResponseCount.toLocaleString('en-US')} (assistant records — one API response spans several transcript lines)`,
    startLine,
    ...endLines,
    ...wallLines,
    modelsLine,
  ].join('\n');

  const totalContextIn =
    summary.usage.inputTokens + summary.usage.cacheReadTokens + summary.usage.cacheCreationTokens;

  const tokensBlock = [
    'TOKENS (this transcript only, excludes sub-agents)',
    `  ${'input (uncached)'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.inputTokens.toLocaleString('en-US')}`,
    `  ${'cache_read'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.cacheReadTokens.toLocaleString('en-US')}`,
    `  ${'cache_creation'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.cacheCreationTokens.toLocaleString('en-US')}`,
    `  ${'output'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.outputTokens.toLocaleString('en-US')}`,
    `  ${'of which thinking'.padEnd(TOKEN_LABEL_WIDTH)}: ${summary.usage.thinkingTokens.toLocaleString('en-US')}`,
    `  ${'TOTAL context-in'.padEnd(TOKEN_LABEL_WIDTH)}: ${totalContextIn.toLocaleString('en-US')}`,
  ].join('\n');

  const toolCallEntries = Object.entries(summary.toolCallCounts).sort(
    ([nameA, countA], [nameB, countB]) =>
      countA === countB ? nameA.localeCompare(nameB) : countB - countA,
  );
  const toolCallTotal = toolCallEntries.reduce((sum, [, count]) => sum + count, 0);

  const toolCallsBlock = [
    `TOOL CALLS (${toolCallTotal.toLocaleString('en-US')})`,
    ...toolCallEntries.map(
      ([name, count]) => `  ${count.toLocaleString('en-US').padStart(TOOL_COUNT_WIDTH)}  ${name}`,
    ),
  ].join('\n');

  const footerBlock = [
    `TOOL RESULT BYTES ${summary.toolResultBytes.toLocaleString('en-US')}`,
    `SUBAGENTS ${summary.subagentCount.toLocaleString('en-US')}`,
  ].join('\n');

  return contentTextContract.parse(
    [headerBlock, tokensBlock, toolCallsBlock, footerBlock].join('\n\n'),
  );
};
