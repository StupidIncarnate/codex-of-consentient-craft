/**
 * PURPOSE: Seeds ONE main session JSONL carrying several SIBLING Task tool-use chains, each with
 * its own stable per-line `uuid` and an OPTIONAL completion notification. `subagent-duration.
 * harness.ts`'s `seedChain` only ever writes one Task per session (a second call overwrites the
 * file), and `session.harness.ts`'s `createMultiSubagentSessionFiles` — the only existing
 * multi-chain seeder — stamps no `uuid` on any line at all. That is fine for the plain
 * `/session/:id` route it was built for, but the execution panel's `subscribe-quest` replay is
 * documented (see `createSubagentSessionFiles`'s own comment in session.harness.ts) to read a
 * session's replay more than once, and the orchestrator's parse-stream-entry transformers fall
 * back to a FRESH random uuid per read when a line carries none — so every sibling chain built
 * that way renders twice in an execution row. This file exists to give each line a uuid stable
 * across re-reads, the same fix `createSubagentSessionFiles` and `createNestedSubagentSessionFiles`
 * already apply for their own one- and two-chain shapes, AND to seed several chains inside the
 * SAME work item's row — two simultaneously `in_progress` work items each carrying their own real
 * session was measured to leave the second session's replay never arriving (`quest.json` written
 * twice in quick succession while the outbox watcher races it), so a frozen-vs-live comparison
 * belongs on two chains in ONE row rather than on two rows.
 *
 * USAGE:
 * const tripleChain = subagentDurationTripleChainHarness({ guildPath: GUILD_PATH });
 * tripleChain.seedSiblingChains({
 *   sessionId: 'e2e-triple-001',
 *   userMessage: 'Kick off triple sub-agent work',
 *   chains: [
 *     { agentId: 'a1', toolUseId: 'toolu_a', taskDescription: 'Alpha work', taskToolUseAt: '...', subagentText: 'Alpha body' },
 *     { agentId: 'a2', toolUseId: 'toolu_b', taskDescription: 'Beta work', taskToolUseAt: '...', subagentText: 'Beta body', notification: { at: '...', durationMs: 4380000 } },
 *   ],
 * });
 * // Writes <sessionId>.jsonl (kickoff + one Task tool_use/completion pair per chain, plus a
 * // <task-notification> line for any chain that names one, in array order) and one
 * // <sessionId>/subagents/agent-<agentId>.jsonl stub per chain. Omitting `notification`, or
 * // omitting `durationMs` inside one, omits the corresponding tag/line entirely.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import {
  AbsoluteFilePathStub,
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  TaskNotificationUserTextStreamLineStub,
  TaskToolResultStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

const KICKOFF_LEAD_MS = 1000;
const COMPLETION_LAG_MS = 1000;
const NOTIFICATION_TOTAL_TOKENS = 28054;
const NOTIFICATION_TOOL_USES = 3;

const offsetIso = ({ at, ms }: { at: string; ms: number }): ReturnType<Date['toISOString']> =>
  new Date(new Date(at).getTime() + ms).toISOString();

// Verbatim `<task-notification>` body Claude CLI appends when a background Task completes.
// `durationMs` omitted means the whole `<duration_ms>` tag is absent — never an empty tag, which
// would reach the web as a parse failure rather than as the field simply not being there. Mirrors
// subagent-duration.harness.ts's own `buildNotificationContent`, duplicated here rather than
// imported: that file is a DO-NOT-EDIT harness another spec owns, and this file also needs to
// stamp a stable `uuid` alongside the content, which its shape has no parameter for.
const buildNotificationContent = ({
  agentId,
  taskToolUseId,
  durationMs,
}: {
  agentId: string;
  taskToolUseId: string;
  durationMs?: number;
}): ReturnType<typeof JSON.stringify> =>
  [
    '<task-notification>',
    `<task-id>${agentId}</task-id>`,
    `<tool-use-id>${taskToolUseId}</tool-use-id>`,
    '<status>completed</status>',
    '<summary>Sub-agent work complete</summary>',
    '<result>Done</result>',
    durationMs === undefined
      ? `<usage><total_tokens>${String(NOTIFICATION_TOTAL_TOKENS)}</total_tokens><tool_uses>${String(NOTIFICATION_TOOL_USES)}</tool_uses></usage>`
      : `<usage><total_tokens>${String(NOTIFICATION_TOTAL_TOKENS)}</total_tokens><tool_uses>${String(NOTIFICATION_TOOL_USES)}</tool_uses><duration_ms>${String(durationMs)}</duration_ms></usage>`,
    '</task-notification>',
  ].join('\n');

export const subagentDurationTripleChainHarness = ({
  guildPath,
}: {
  guildPath: string;
}): {
  beforeEach: () => void;
  afterEach: () => void;
  seedSiblingChains: (params: {
    sessionId: string;
    userMessage: string;
    chains: readonly {
      agentId: string;
      toolUseId: string;
      taskDescription: string;
      taskToolUseAt: string;
      subagentText: string;
      notification?: { at: string; durationMs?: number };
    }[];
  }) => void;
} => {
  const getJsonlDir = (): AbsoluteFilePath =>
    claudePathSlugEncoderTransformer({
      homeDir: AbsoluteFilePathStub({ value: os.homedir() }),
      projectPath: AbsoluteFilePathStub({ value: guildPath }),
    });

  const cleanSessionDirectory = (): void => {
    fs.rmSync(getJsonlDir(), { recursive: true, force: true });
  };

  const seedSiblingChains = ({
    sessionId,
    userMessage,
    chains,
  }: {
    sessionId: string;
    userMessage: string;
    chains: readonly {
      agentId: string;
      toolUseId: string;
      taskDescription: string;
      taskToolUseAt: string;
      subagentText: string;
      notification?: { at: string; durationMs?: number };
    }[];
  }): void => {
    const jsonlDir = getJsonlDir();
    const [firstChain] = chains;
    const kickoffAt =
      firstChain === undefined
        ? new Date().toISOString()
        : offsetIso({ at: firstChain.taskToolUseAt, ms: -KICKOFF_LEAD_MS });

    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
        uuid: `${sessionId}-user`,
        timestamp: kickoffAt,
      }),
    ];

    chains.forEach((chain, index) => {
      mainLines.push(
        JSON.stringify({
          ...AssistantTaskToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: chain.toolUseId,
                  name: 'Task',
                  input: { description: chain.taskDescription, prompt: 'Do the sub-agent work' },
                },
              ],
            },
          }),
          uuid: `${sessionId}-task-${String(index)}`,
          timestamp: chain.taskToolUseAt,
        }),
      );
      mainLines.push(
        JSON.stringify({
          ...TaskToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: chain.toolUseId, content: 'launched' }],
            },
            toolUseResult: { agentId: chain.agentId },
          }),
          uuid: `${sessionId}-result-${String(index)}`,
          timestamp: offsetIso({ at: chain.taskToolUseAt, ms: COMPLETION_LAG_MS }),
        }),
      );

      if (chain.notification !== undefined) {
        const { at, durationMs } = chain.notification;
        mainLines.push(
          JSON.stringify({
            ...TaskNotificationUserTextStreamLineStub({
              message: {
                role: 'user',
                content: buildNotificationContent({
                  agentId: chain.agentId,
                  taskToolUseId: chain.toolUseId,
                  ...(durationMs === undefined ? {} : { durationMs }),
                }),
              },
            }),
            uuid: `${sessionId}-notification-${String(index)}`,
            timestamp: at,
          }),
        );
      }
    });

    fs.mkdirSync(jsonlDir, { recursive: true });
    fs.writeFileSync(path.join(jsonlDir, `${sessionId}.jsonl`), `${mainLines.join('\n')}\n`);

    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });

    chains.forEach((chain, index) => {
      const line = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: { role: 'assistant', content: [{ type: 'text', text: chain.subagentText }] },
        }),
        uuid: `${sessionId}-subagent-${String(index)}`,
        timestamp: chain.taskToolUseAt,
      });
      fs.writeFileSync(path.join(subagentDir, `agent-${chain.agentId}.jsonl`), `${line}\n`);
    });
  };

  return {
    beforeEach: cleanSessionDirectory,
    afterEach: cleanSessionDirectory,
    seedSiblingChains,
  };
};
