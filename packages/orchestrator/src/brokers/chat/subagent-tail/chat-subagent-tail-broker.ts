/**
 * PURPOSE: Tails a subagent's JSONL file in real-time and feeds lines through a shared processor instance, dispatching fully-parsed ChatEntry arrays via callbacks. Relies on the processor's realAgentId→toolUseId translation map (populated by user tool_result lines on the parent stream) to stamp sub-agent lines with the correct `parent_tool_use_id` — so they converge on the same wire shape as streaming-source lines.
 *
 * USAGE:
 * const { stop, initialDrain } = await chatSubagentTailBroker({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
 *   agentId: AgentIdStub({ value: 'agent-1' }),
 *   processor: chatLineProcessTransformer(),
 *   onEntries: ({ chatProcessId, entries }) => { },
 *   chatProcessId: ProcessIdStub({ value: 'proc-123' }),
 * });
 * // `stop` ends the tail; `initialDrain` resolves once the pre-existing JSONL content has
 * // been fully delivered. Callers MUST await initialDrain before stop() if they need the
 * // pre-existing lines to reach the renderer (chat-start-responder.onComplete relies on
 * // this — without the await the readline 'line' events queued by the synthetic-emit
 * // drain race against state.stopped and silently drop sub-agent entries).
 *
 * `cwd` is the directory the PARENT session was spawned in, and it is required: a sub-agent
 * inherits its parent's cwd, and Claude CLI names the `~/.claude/projects/<encoded-cwd>/`
 * directory from that cwd — so a carved quest's sub-agents write under the worktree's encoding.
 * This broker also mkdir+touches the path before watching it, so a guild-derived answer would
 * CREATE an empty file at the wrong address and tail that forever.
 */

import { tailFile } from '#gateway/node/fs';
import { appendFile, ensureDir } from '#gateway/node/fs__promises';
import { getEnv, stderr } from '#gateway/node/process';
import { homedir } from '#gateway/node/os';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import type { ChatEntry, Agent, Session } from '@dungeonmaster/shared/contracts';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';

import type { ChatLineProcessor } from '../../../contracts/chat-line-processor/chat-line-processor-contract';

export const chatSubagentTailBroker = async ({
  sessionId,
  cwd,
  agentId,
  processor,
  onEntries,
  chatProcessId,
}: {
  sessionId: Session['id'];
  cwd: string;
  agentId: Agent['id'];
  processor: ChatLineProcessor;
  onEntries: (params: { chatProcessId: string; entries: ChatEntry[] }) => void;
  chatProcessId: string;
}): Promise<{ stop: () => void; initialDrain: Promise<void> }> => {
  const projectPath = cwd;
  const homeDir = homedir();

  const jsonlPath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  // Built directly rather than derived via `dirname` of the full path below: `#gateway/node/path`'s
  // `dirname` is a single function shared with unrelated callers (e.g. the config-file walk-up in
  // `portConfigWalkBroker`), which stage it with EXACT addresses of their own — an arbitrary
  // subagents-dir argument would miss those and throw "nothing set up". Computing the directory
  // from the same pieces the full path is built from sidesteps that shared mock entirely.
  const subagentsDir = `${stripJsonlSuffixTransformer({ filePath: jsonlPath })}/subagents`;
  const subagentJsonlPath = `${subagentsDir}/agent-${agentId}.jsonl`;

  // Ensure the directory + file exist before handing the path to tailFile.
  // For a `run_in_background` Task, Claude CLI emits the `async_launched` tool_result on
  // stdout BEFORE it has finished creating `subagents/agent-<realAgentId>.jsonl` on disk.
  // `fs.watch` on a missing path throws ENOENT synchronously and the broker rejects, so
  // none of the agent's later activity reaches the wire even though Claude CLI writes
  // the JSONL within a few hundred milliseconds. mkdir+append('') is a touch — creates
  // an empty file if missing, leaves existing content untouched (no truncate).
  await ensureDir(subagentsDir);
  await appendFile(subagentJsonlPath, '');

  const subagentSource = 'subagent';

  const subagentDebug = getEnv('SUBAGENT_DEBUG') === '1';
  if (subagentDebug) {
    stderr.write(
      `[SUBAGENT-TRACE][SUBAGENT-TAIL-OPEN] agentId=${String(agentId)} path=${subagentJsonlPath}\n`,
    );
  }
  const handle = tailFile({
    path: subagentJsonlPath,
    onLine: ({ line }) => {
      if (subagentDebug) {
        stderr.write(`[SUBAGENT-TRACE][SUBAGENT-RAW] agentId=${String(agentId)} ${line}\n`);
      }
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const outputs = processor.processLine({
        parsed,
        source: subagentSource,
        agentId,
      });

      for (const output of outputs) {
        if (output.type === 'entries') {
          if (subagentDebug) {
            for (const entry of output.entries) {
              const entryRole = entry.role;
              const entryType = 'type' in entry ? entry.type : 'n/a';
              const entryToolName = 'toolName' in entry ? entry.toolName : 'n/a';
              const entryAgentIdVal = 'agentId' in entry ? entry.agentId : 'n/a';
              const entrySource = 'source' in entry ? entry.source : 'n/a';
              stderr.write(
                `[SUBAGENT-TRACE][SUBAGENT-ENTRY] agentId=${agentId} role=${entryRole} type=${entryType} toolName=${entryToolName} entryAgentId=${entryAgentIdVal} source=${entrySource}\n`,
              );
            }
          }
          onEntries({ chatProcessId, entries: output.entries });
        }
        // `agent-detected` outputs are consumed upstream by chat-spawn-broker; the tail
        // only forwards ChatEntry batches to the renderer.
      }
    },
    onError: () => {
      // Errors during tail are non-fatal; the watcher will retry on next change
    },
  });

  return { stop: handle.stop, initialDrain: handle.initialDrain };
};
