/**
 * PURPOSE: Resolves the realAgentId of the Task-dispatched sub-agent currently calling an MCP
 * tool, by scanning `~/.claude/projects/<encoded-cwd>/<parentSessionId>/subagents/agent-*.meta.json`
 * for the file whose `toolUseId` field matches the toolUseId Claude Code surfaces on every
 * MCP call via `request.params._meta['claudecode/toolUseId']`. The match is deterministic —
 * each Task() dispatch writes its own meta.json with a unique toolUseId, so no mtime races
 * or parent-session ambiguity. Returns the realAgentId for the work item's `agentId` stamp.
 *
 * USAGE:
 * const realAgentId = await claudeCodeSubagentFindByToolUseIdBroker({
 *   projectDir, parentSessionId, toolUseId
 * });
 * // Returns the matching sub-agent's realAgentId, or undefined when the subagents dir does
 * // not exist, no meta.json's `toolUseId` matches, or all candidates fail to JSON-parse.
 */

import {
  agentIdContract,
  pathSegmentContract,
  type AbsoluteFilePath,
  type AgentId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirIfExistsAdapter } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter';
import { claudeCodeSubagentMetaContract } from '../../../contracts/claude-code-subagent-meta/claude-code-subagent-meta-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';

const AGENT_PREFIX = 'agent-';
const META_SUFFIX = '.meta.json';

export const claudeCodeSubagentFindByToolUseIdBroker = async ({
  projectDir,
  parentSessionId,
  toolUseId,
}: {
  projectDir: AbsoluteFilePath;
  parentSessionId: SessionId;
  toolUseId: ToolUseId;
}): Promise<AgentId | undefined> => {
  const homeDir = osUserHomedirAdapter();
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir,
    projectPath: projectDir,
  });
  const subagentsDir = `${String(sessionsDir)}/${String(parentSessionId)}/subagents`;

  const entries = await fsReaddirIfExistsAdapter({
    filepath: pathSegmentContract.parse(subagentsDir),
  });
  if (entries === undefined) {
    return undefined;
  }

  // Each Task() dispatch produces one `agent-<realAgentId>.meta.json` sidecar at spawn time
  // (before the sub-agent's first MCP call), shape: { agentType, description, toolUseId }.
  // We read every candidate in parallel and match on the `toolUseId` field.
  const candidates = entries
    .map((entry) => String(entry))
    .filter((name) => name.startsWith(AGENT_PREFIX) && name.endsWith(META_SUFFIX));

  const reads = await Promise.all(
    candidates.map(async (name) => {
      const filepath = pathSegmentContract.parse(`${subagentsDir}/${name}`);
      try {
        const contents = String(await fsReadFileAdapter({ filepath }));
        const parsed = claudeCodeSubagentMetaContract.safeParse(JSON.parse(contents));
        if (parsed.success && parsed.data.toolUseId === toolUseId) {
          return name;
        }
        return undefined;
      } catch {
        return undefined;
      }
    }),
  );

  for (const matchedName of reads) {
    if (matchedName === undefined) continue;
    const realAgentId = matchedName.slice(
      AGENT_PREFIX.length,
      matchedName.length - META_SUFFIX.length,
    );
    if (realAgentId.length === 0) continue;
    return agentIdContract.parse(realAgentId);
  }
  return undefined;
};
