/**
 * PURPOSE: Resolves the realAgentId of the Task-dispatched sub-agent currently calling an MCP
 * tool, by scanning `~/.claude/projects/<encoded-cwd>/<parentSessionId>/subagents/agent-*.jsonl`
 * for the file whose first line embeds the supplied workItemId (Claude CLI writes
 * `Task.input.prompt` verbatim as the sub-agent's first user-text line, and the orchestrator's
 * dispatch taskPrompt embeds `workItemId: "<uuid>"` literally). The match is byte-stable —
 * each subagent file is unique per dispatch — and the returned realAgentId is what the
 * work item stores in its `agentId` field (the parent's session UUID is stored separately
 * in `sessionId`).
 *
 * **Fallback path only.** Depends on the upstream `claudeCodeSessionResolveBroker` having
 * picked the correct parentSessionId via mtime, which races under cross-session activity.
 * The primary deterministic path for sub-agent identification is
 * `claudeCodeSubagentFindByToolUseIdBroker` (matches against `_meta.claudecode/toolUseId`).
 * This broker is kept for older Claude Code clients that don't populate `_meta`.
 *
 * USAGE:
 * const realAgentId = await claudeCodeSubagentFindByWorkItemIdBroker({
 *   projectDir, parentSessionId, workItemId
 * });
 * // Returns the matching sub-agent's realAgentId, or undefined when no subagents/ dir exists
 * // or no file's first line matches the workItemId pattern.
 */

import {
  absoluteFilePathContract,
  agentIdContract,
  pathSegmentContract,
  type AbsoluteFilePath,
  type AgentId,
  type QuestWorkItemId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirIfExistsAdapter } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter';

const AGENT_PREFIX = 'agent-';
const JSONL_SUFFIX = '.jsonl';

export const claudeCodeSubagentFindByWorkItemIdBroker = async ({
  projectDir,
  parentSessionId,
  workItemId,
}: {
  projectDir: AbsoluteFilePath;
  parentSessionId: SessionId;
  workItemId: QuestWorkItemId;
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

  // The subagent JSONL stores the taskPrompt as a JSON-encoded string value, so the
  // embedded `workItemId: "<uuid>"` appears with escaped quotes: `workItemId: \"<uuid>\"`.
  // Match that literal byte sequence, not the unescaped form.
  const needle = `workItemId: \\"${String(workItemId)}\\"`;

  // Read every candidate file in parallel and capture its first line. Each agent JSONL
  // file is short; we'd otherwise need `await` inside a sequential loop. The first match
  // wins — Claude CLI assigns one realAgentId per Task dispatch, so collisions on the
  // workItemId needle are not expected.
  const candidates = entries
    .map((entry) => String(entry))
    .filter((name) => name.startsWith(AGENT_PREFIX) && name.endsWith(JSONL_SUFFIX));

  const reads = await Promise.all(
    candidates.map(async (name) => {
      const filepath = absoluteFilePathContract.parse(`${subagentsDir}/${name}`);
      try {
        const contents = String(
          await fsReadFileAdapter({ filepath: pathSegmentContract.parse(filepath) }),
        );
        const firstLineEnd = contents.indexOf('\n');
        const firstLine = firstLineEnd === -1 ? contents : contents.slice(0, firstLineEnd);
        return { name, firstLine };
      } catch {
        return undefined;
      }
    }),
  );

  for (const read of reads) {
    if (read === undefined) continue;
    if (!read.firstLine.includes(needle)) continue;
    const realAgentId = read.name.slice(
      AGENT_PREFIX.length,
      read.name.length - JSONL_SUFFIX.length,
    );
    if (realAgentId.length === 0) continue;
    return agentIdContract.parse(realAgentId);
  }
  return undefined;
};
