/**
 * PURPOSE: The subagent ingredient's `query` route — lists every `agent-<agentId>.jsonl` file
 * under a session's `subagents/` directory, resolves each one's `toolUseId` off a correlation line
 * found in the PARENT session's lines OR any sibling subagent file's own lines, then narrows to the
 * ones matching `where`.
 *
 * `where` must carry `cwd` and `sessionId`: a sub-agent's directory is encoded from its parent
 * session's `cwd` and `sessionId`, not stored anywhere else. A record whose `toolUseId` cannot be
 * resolved (no completed correlation line yet — an in-flight subagent) is EXCLUDED, since
 * `subagentRecordContract` requires the field and a caller has no honest value to give it.
 *
 * The search pool spans the top session's own lines PLUS every sibling subagent file's own lines,
 * never the top session alone — a depth-2+ chain's completion for level N lives in level N-1's OWN
 * file, exactly as `chatHistoryReplayBroker`'s own header describes ("B's completion tool_result
 * lives in A's subagent JSONL"), so a search scoped to the top session only would resolve level 1's
 * `toolUseId` and silently drop every deeper level.
 *
 * USAGE:
 * await subagentQueryRouteBroker({ target, where: { cwd: '/tmp/guild-1', sessionId: 'seed-session-1' } });
 * // Returns every completed subagent transcript under that session
 */
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { readFileSync, readdirEntriesSync } from '#gateway/node/fs';
import {
  absoluteFilePathContract,
  agentIdContract,
  contentTextContract,
  lineCountContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

import { isJsonlFileGuard } from '../../../guards/is-jsonl-file/is-jsonl-file-guard';
import { matchesWhereClauseGuard } from '../../../guards/matches-where-clause/matches-where-clause-guard';
import { stripJsonlExtensionTransformer } from '../../../transformers/strip-jsonl-extension/strip-jsonl-extension-transformer';
import { toolUseIdFromParentLinesTransformer } from '../../../transformers/tool-use-id-from-parent-lines/tool-use-id-from-parent-lines-transformer';
import { subagentRecordContract } from '../../../contracts/subagent-record/subagent-record-contract';
import type { SubagentRecord } from '../../../contracts/subagent-record/subagent-record-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const AGENT_FILENAME_PREFIX = 'agent-';

export const subagentQueryRouteBroker = ({
  target,
  where,
}: {
  target: DmTarget;
  where: Record<string, unknown>;
}): SubagentRecord[] => {
  const { cwd: cwdValue, sessionId: sessionIdValue, ...rest } = where;
  const cwd = absoluteFilePathContract.parse(cwdValue);
  const sessionId = sessionIdContract.parse(sessionIdValue);
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir: target.claudeHome,
    projectPath: cwd,
  });
  const subagentsDirPath = absoluteFilePathContract.parse(`${sessionsDir}/${sessionId}/subagents`);
  const parentFilePath = absoluteFilePathContract.parse(`${sessionsDir}/${sessionId}.jsonl`);

  const parentLines = contentTextContract
    .parse(readFileSync(parentFilePath))
    .split('\n')
    .filter((line) => line.length > 0);

  const entries = readdirEntriesSync(subagentsDirPath);
  const subagentFiles = entries.filter(
    (entry) => entry.kind === 'file' && isJsonlFileGuard({ filename: entry.name }),
  );

  const subagentFileLines = subagentFiles.map((entry) => {
    const filePath = absoluteFilePathContract.parse(`${subagentsDirPath}/${entry.name}`);
    return {
      entry,
      filePath,
      lines: contentTextContract
        .parse(readFileSync(filePath))
        .split('\n')
        .filter((line) => line.length > 0),
    };
  });

  const searchPool = [...parentLines, ...subagentFileLines.flatMap(({ lines }) => lines)];

  const records = subagentFileLines.flatMap(({ entry, filePath, lines }) => {
    const stem = stripJsonlExtensionTransformer({ filename: entry.name });
    const agentId = agentIdContract.parse(stem.slice(AGENT_FILENAME_PREFIX.length));
    const toolUseId = toolUseIdFromParentLinesTransformer({ parentLines: searchPool, agentId });

    if (toolUseId === undefined) {
      return [];
    }

    const lineCount = lineCountContract.parse(lines.length);

    return [subagentRecordContract.parse({ agentId, toolUseId, filePath, lineCount })];
  });

  return records.filter((record) => matchesWhereClauseGuard({ record, where: rest }));
};
