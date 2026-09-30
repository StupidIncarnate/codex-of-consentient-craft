/**
 * PURPOSE: The session ingredient's `withNestedChain` extra — writes a `depth`-level chain of
 * sub-agent transcripts, each level launched by a real assistant Task tool_use in its PARENT's own
 * file (the top session for level 1, the previous level's own subagent file for level 2+) and
 * closed by a matching tool_result correlation in that SAME parent — the shape
 * `chatHistoryReplayBroker`'s own header describes ("B's completion tool_result lives in A's
 * subagent JSONL"), so a depth-2 chain renders as two nested SUBAGENT_CHAIN levels rather than two
 * orphan tool_result rows on the top session (DEF-91).
 *
 * `subagentWriteRouteBroker` runs with `completed: false` here for every level — its own built-in
 * correlation always targets the TOP session (`session-write-route-broker.ts`'s sibling header),
 * which is only correct for level 1, so every level's Task tool_use AND tool_result correlation are
 * appended directly through `appendLinesCreatingParent` against that level's OWN parent instead, keeping
 * one code path for every depth rather than a level-1 special case.
 *
 * Levels run SEQUENTIALLY (`reduce`, not `Promise.all`): level N's own file must already exist, and
 * its Task tool_use line must already be appended to its parent, before level N+1 can write its own
 * completion correlation back onto it.
 *
 * USAGE:
 * await sessionNestedChainBroker({ target, record: sessionRecord, args: { depth: 2 } });
 * // Appends a Task tool_use + tool_result to the session, writes agent-seed-agent-1.jsonl, then
 * // appends a nested Task tool_use + tool_result to THAT file and writes agent-seed-agent-1-1.jsonl
 */
import { agentContract, sessionContract } from '@dungeonmaster/shared/contracts';
import {
  claudePathSlugEncoderTransformer,
  streamLineToJsonLineTransformer,
} from '@dungeonmaster/shared/transformers';

import { appendLinesCreatingParent } from '#gateway/node/fs__promises';
import { z } from '#gateway/npm/zod';
import { subagentWriteRouteBroker } from '../../subagent/write-route/subagent-write-route-broker';
import { nestedChainArgsContract } from '../../../contracts/nested-chain-args/nested-chain-args-contract';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';
import { transcriptAssistantTaskToolUseLineTransformer } from '../../../transformers/transcript-assistant-task-tool-use-line/transcript-assistant-task-tool-use-line-transformer';
import { transcriptAssistantTextLineTransformer } from '../../../transformers/transcript-assistant-text-line/transcript-assistant-text-line-transformer';
import { transcriptTaskToolResultLineTransformer } from '../../../transformers/transcript-task-tool-result-line/transcript-task-tool-result-line-transformer';

const NESTING_SUFFIX = '-1';
const COMPLETION_RESULT = 'done';

export const sessionNestedChainBroker = async ({
  target,
  record,
  args,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
  args: Record<string, unknown>;
}): Promise<void> => {
  const { depth } = nestedChainArgsContract.parse(args);
  const sessionId = sessionContract.shape.id.parse(record.sessionId);
  const cwd = z.string().parse(record.cwd);
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir: target.claudeHome,
    projectPath: cwd,
  });
  const sessionFilePath = `${sessionsDir}/${sessionId}.jsonl`;
  const levels = Array.from({ length: depth }, (_unused, index) => index + 1);

  await levels.reduce<Promise<void>>(async (previous, level) => {
    await previous;

    const previousLevel = level - 1;
    const agentId = agentContract.shape.id.parse(`seed-agent-1${NESTING_SUFFIX.repeat(previousLevel)}`);
    const toolUseId = toolUseIdContract.parse(`toolu_seed_nested_${level}`);
    const parentFilePath =
      level === 1
        ? sessionFilePath
        : `${sessionsDir}/${sessionId}/subagents/agent-seed-agent-1${NESTING_SUFFIX.repeat(previousLevel - 1)}.jsonl`;

    await appendLinesCreatingParent({
      path: parentFilePath,
      lines: [
        streamLineToJsonLineTransformer({
          streamLine: transcriptAssistantTaskToolUseLineTransformer({
            toolUseId,
            description: `Nested task ${level}`,
            prompt: `Nested prompt ${level}`,
          }),
        }),
      ],
    });

    await subagentWriteRouteBroker({
      target,
      fields: {
        agentId,
        toolUseId,
        taskDescription: `Nested task ${level}`,
        taskPrompt: `Nested prompt ${level}`,
        lines: [
          streamLineToJsonLineTransformer({
            streamLine: transcriptAssistantTextLineTransformer({
              text: `Nested agent ${level} response`,
            }),
          }),
        ],
        completed: false,
        sessionId,
        cwd,
      },
    });

    await appendLinesCreatingParent({
      path: parentFilePath,
      lines: [
        streamLineToJsonLineTransformer({
          streamLine: transcriptTaskToolResultLineTransformer({
            toolUseId,
            content: COMPLETION_RESULT,
            agentId,
          }),
        }),
      ],
    });
  }, Promise.resolve());
};
