/**
 * PURPOSE: The subagent ingredient's `write` route — writes a sub-agent's own
 * `agent-<agentId>.jsonl` beside its parent session, and when `completed` is true, appends the
 * ONE line where `toolUseId` (Task's id) and `agentId` (the real internal id) co-occur onto the
 * PARENT session, exactly as `packages/orchestrator/CLAUDE.md`'s "Two-source sub-agent
 * correlation" describes. See `session-ingredient-broker.ts`'s own header for the `copies:`
 * finding this shares.
 *
 * `userToolResultStreamLineContract` — the shape this correlation line is validated through —
 * declares no `uuid`/`timestamp` fields at all, so passing them (measured directly) is silently
 * stripped by `.parse()` rather than preserved; this route mints neither `Date.now()` nor
 * `crypto.randomUUID()` for it, so nothing here is non-deterministic, but the "stable per-line
 * uuid/timestamp" dedup property `session.harness.ts:309-313` describes cannot be reproduced
 * through this shared contract as it stands today — a finding, not a workaround. The caller's own
 * `lines` are written verbatim: their content is whichever real stream-line stub a recipe builds
 * them from (`AssistantTaskToolUseStreamLineStub`, etc.), the same division
 * `session-write-route-broker` already makes for a session's own lines.
 *
 * USAGE:
 * await subagentWriteRouteBroker({ target, fields: { agentId, toolUseId, taskDescription, taskPrompt, lines, completed, sessionId, cwd } });
 * // Returns a SubagentRecord
 */
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import {
  absoluteFilePathContract,
  lineCountContract,
  streamJsonLineContract,
  userToolResultStreamLineContract,
} from '@dungeonmaster/shared/contracts';

import { dmJsonlAppendAdapter } from '../../../adapters/dm-jsonl/append/dm-jsonl-append-adapter';
import { subagentFieldsContract } from '../../../contracts/subagent-fields/subagent-fields-contract';
import { subagentRecordContract } from '../../../contracts/subagent-record/subagent-record-contract';
import type { SubagentRecord } from '../../../contracts/subagent-record/subagent-record-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const subagentWriteRouteBroker = async ({
  target,
  fields,
}: {
  target: DmTarget;
  fields: Record<string, unknown>;
}): Promise<SubagentRecord> => {
  const parsedFields = subagentFieldsContract.parse(fields);
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir: target.claudeHome,
    projectPath: parsedFields.cwd,
  });
  const parentFilePath = absoluteFilePathContract.parse(
    `${sessionsDir}/${parsedFields.sessionId}.jsonl`,
  );
  const subagentFilePath = absoluteFilePathContract.parse(
    `${sessionsDir}/${parsedFields.sessionId}/subagents/agent-${parsedFields.agentId}.jsonl`,
  );

  await dmJsonlAppendAdapter({ filePath: subagentFilePath, lines: parsedFields.lines });

  if (parsedFields.completed) {
    const correlationLine = userToolResultStreamLineContract.parse({
      type: 'user',
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: parsedFields.toolUseId,
            content: 'done',
          },
        ],
      },
      toolUseResult: { agentId: parsedFields.agentId },
    });

    await dmJsonlAppendAdapter({
      filePath: parentFilePath,
      lines: [streamJsonLineContract.parse(JSON.stringify(correlationLine))],
    });
  }

  return subagentRecordContract.parse({
    agentId: parsedFields.agentId,
    toolUseId: parsedFields.toolUseId,
    filePath: subagentFilePath,
    lineCount: lineCountContract.parse(parsedFields.lines.length),
  });
};
