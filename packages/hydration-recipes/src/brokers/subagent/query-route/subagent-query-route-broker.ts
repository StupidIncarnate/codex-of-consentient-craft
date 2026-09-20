/**
 * PURPOSE: The subagent ingredient's `query` route — lists every `agent-<agentId>.jsonl` file
 * under a session's `subagents/` directory, resolves each one's `toolUseId` off the parent
 * session's own correlation line, then narrows to the ones matching `where`.
 *
 * `where` must carry `cwd` and `sessionId`: a sub-agent's directory is encoded from its parent
 * session's `cwd` and `sessionId`, not stored anywhere else. A record whose `toolUseId` cannot be
 * resolved (no completed correlation line yet — an in-flight subagent) is EXCLUDED, since
 * `subagentRecordContract` requires the field and a caller has no honest value to give it.
 *
 * USAGE:
 * await subagentQueryRouteBroker({ target, where: { cwd: '/tmp/guild-1', sessionId: 'seed-session-1' } });
 * // Returns every completed subagent transcript under that session
 */
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { fsReadFileSyncAdapter, fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  agentIdContract,
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

  const parentLines = fsReadFileSyncAdapter({ filePath: parentFilePath })
    .split('\n')
    .filter((line) => line.length > 0);

  const entries = fsReaddirWithTypesAdapter({ dirPath: subagentsDirPath });
  const subagentFiles = entries.filter(
    (entry) => entry.isFile() && isJsonlFileGuard({ filename: entry.name }),
  );

  const records = subagentFiles.flatMap((entry) => {
    const stem = stripJsonlExtensionTransformer({ filename: entry.name });
    const agentId = agentIdContract.parse(stem.slice(AGENT_FILENAME_PREFIX.length));
    const toolUseId = toolUseIdFromParentLinesTransformer({ parentLines, agentId });

    if (toolUseId === undefined) {
      return [];
    }

    const filePath = absoluteFilePathContract.parse(`${subagentsDirPath}/${entry.name}`);
    const contents = fsReadFileSyncAdapter({ filePath });
    const lineCount = lineCountContract.parse(
      contents.split('\n').filter((line) => line.length > 0).length,
    );

    return [subagentRecordContract.parse({ agentId, toolUseId, filePath, lineCount })];
  });

  return records.filter((record) => matchesWhereClauseGuard({ record, where: rest }));
};
