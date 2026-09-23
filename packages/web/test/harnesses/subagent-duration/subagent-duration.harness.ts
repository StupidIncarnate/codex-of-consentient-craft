/**
 * PURPOSE: Seeds a sub-agent chain's on-disk JSONL shape with CALLER-CHOSEN timestamps and an
 * optional, cleanly-omittable `<duration_ms>` — the one thing
 * `session.harness.ts`'s `createBackgroundAgentSession` cannot do, since its notification hardcodes
 * `<duration_ms>9033</duration_ms>` inside a fixed `<usage>` block. Every subagent-duration E2E spec
 * needs a Task tool-use timestamped relative to an installed fake clock and a notification whose
 * `durationMs` (or absence) is the exact thing under test, so this harness exists to make both
 * caller-chosen instead of fixed.
 *
 * USAGE:
 * const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
 * await subagentDuration.seedChain({
 *   sessionId: 'e2e-subagent-duration-001',
 *   agentId: 'realagent001',
 *   taskToolUseId: 'toolu_subagent_duration_001',
 *   taskDescription: 'Sub-agent work',
 *   taskToolUseAt: '2026-01-01T11:56:00.000Z',
 * });
 * // Writes <sessionId>.jsonl (kickoff + Task tool_use + completion tool_result) and
 * // <sessionId>/subagents/agent-<agentId>.jsonl (a stub body), with no notification line.
 *
 * await subagentDuration.appendNotification({
 *   sessionId: 'e2e-subagent-duration-001',
 *   agentId: 'realagent001',
 *   taskToolUseId: 'toolu_subagent_duration_001',
 *   at: '2026-01-01T12:13:00.000Z',
 *   durationMs: 270000,
 * });
 * // Appends a <task-notification> line to the MAIN session JSONL — the notification landing
 * // mid-test, after the chain already rendered live. Omit durationMs to omit the whole tag.
 */
import * as fs from 'fs';
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
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

const KICKOFF_LEAD_MS = 1000;
const COMPLETION_LAG_MS = 1000;
const OUTER_COMPLETION_LAG_MS = 10_000;
const INNER_COMPLETION_LAG_MS = 1000;
const NOTIFICATION_TOTAL_TOKENS = 28054;
const NOTIFICATION_TOOL_USES = 3;

const offsetIso = ({ at, ms }: { at: string; ms: number }): ReturnType<Date['toISOString']> =>
  new Date(new Date(at).getTime() + ms).toISOString();

// Verbatim `<task-notification>` body Claude CLI appends when a background Task completes.
// `durationMs` omitted means the whole `<duration_ms>` tag is absent — never an empty tag, which
// would reach the web as a parse failure rather than as the field simply not being there.
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

const buildNotificationLine = ({
  agentId,
  taskToolUseId,
  at,
  durationMs,
}: {
  agentId: string;
  taskToolUseId: string;
  at: string;
  durationMs?: number;
}): ReturnType<typeof JSON.stringify> =>
  JSON.stringify({
    ...TaskNotificationUserTextStreamLineStub({
      message: {
        role: 'user',
        content: buildNotificationContent({
          agentId,
          taskToolUseId,
          ...(durationMs === undefined ? {} : { durationMs }),
        }),
      },
    }),
    timestamp: at,
  });

export const subagentDurationHarness = ({
  guildPath,
}: {
  guildPath: string;
}): {
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  seedChain: (params: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    taskDescription: string;
    taskToolUseAt: string;
    notification?: { at: string; durationMs?: number };
  }) => Promise<void>;
  appendNotification: (params: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    at: string;
    durationMs?: number;
  }) => Promise<void>;
  seedNestedChain: (params: {
    sessionId: string;
    outerAgentId: string;
    outerToolUseId: string;
    outerDescription: string;
    outerTaskToolUseAt: string;
    outerNotification?: { at: string; durationMs?: number };
    innerAgentId: string;
    innerToolUseId: string;
    innerDescription: string;
    innerTaskToolUseAt: string;
    innerNotification?: { at: string; durationMs?: number };
  }) => Promise<void>;
} => {
  const getJsonlDir = (): AbsoluteFilePath =>
    claudePathSlugEncoderTransformer({
      homeDir: osUserHomedirAdapter(),
      projectPath: AbsoluteFilePathStub({ value: guildPath }),
    });

  const cleanSessionDirectory = async (): Promise<void> => {
    await fs.promises.rm(getJsonlDir(), { recursive: true, force: true });
  };

  const writeSubagentStub = async ({
    jsonlDir,
    sessionId,
    agentId,
    at,
    text,
  }: {
    jsonlDir: AbsoluteFilePath;
    sessionId: string;
    agentId: string;
    at: string;
    text: string;
  }): Promise<void> => {
    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    await fs.promises.mkdir(subagentDir, { recursive: true });
    const line = JSON.stringify({
      ...AssistantTextStreamLineStub({
        message: { role: 'assistant', content: [{ type: 'text', text }] },
      }),
      timestamp: at,
    });
    await fs.promises.writeFile(path.join(subagentDir, `agent-${agentId}.jsonl`), `${line}\n`);
  };

  const seedChain = async ({
    sessionId,
    agentId,
    taskToolUseId,
    taskDescription,
    taskToolUseAt,
    notification,
  }: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    taskDescription: string;
    taskToolUseAt: string;
    notification?: { at: string; durationMs?: number };
  }): Promise<void> => {
    const jsonlDir = getJsonlDir();
    const kickoffAt = offsetIso({ at: taskToolUseAt, ms: -KICKOFF_LEAD_MS });
    const completedAt = offsetIso({ at: taskToolUseAt, ms: COMPLETION_LAG_MS });

    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({
          message: { role: 'user', content: 'Kick off sub-agent work' },
        }),
        timestamp: kickoffAt,
      }),
      JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: taskToolUseId,
                name: 'Task',
                input: { description: taskDescription, prompt: 'Do the sub-agent work' },
              },
            ],
          },
        }),
        timestamp: taskToolUseAt,
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: taskToolUseId, content: 'launched' }],
          },
          toolUseResult: { agentId },
        }),
        timestamp: completedAt,
      }),
      ...(notification === undefined
        ? []
        : [
            buildNotificationLine({
              agentId,
              taskToolUseId,
              at: notification.at,
              ...(notification.durationMs === undefined
                ? {}
                : { durationMs: notification.durationMs }),
            }),
          ]),
    ];

    await fs.promises.mkdir(jsonlDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(jsonlDir, `${sessionId}.jsonl`),
      `${mainLines.join('\n')}\n`,
    );

    await writeSubagentStub({
      jsonlDir,
      sessionId,
      agentId,
      at: taskToolUseAt,
      text: 'Sub-agent work body',
    });
  };

  const appendNotification = async ({
    sessionId,
    agentId,
    taskToolUseId,
    at,
    durationMs,
  }: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    at: string;
    durationMs?: number;
  }): Promise<void> => {
    const jsonlDir = getJsonlDir();
    await fs.promises.mkdir(jsonlDir, { recursive: true });
    const line = buildNotificationLine({
      agentId,
      taskToolUseId,
      at,
      ...(durationMs === undefined ? {} : { durationMs }),
    });
    await fs.promises.appendFile(path.join(jsonlDir, `${sessionId}.jsonl`), `${line}\n`);
  };

  // Outer chain lives in the MAIN session file, exactly like seedChain. The inner chain is
  // launched FROM the outer agent's own transcript, so its Task line, its completion tool_result
  // AND (if seeded) its own notification all live inside `agent-<outerAgentId>.jsonl` — Claude CLI
  // writes a Task-dispatched notification into whichever transcript did the dispatching, and the
  // outer sub-agent is what dispatched the inner one. Caller must pass outerTaskToolUseAt strictly
  // before innerTaskToolUseAt: collectSubagentChainsTransformer splices the nested chain in at the
  // position of the Task that launched it, which only exists once the outer chain itself does.
  const seedNestedChain = async ({
    sessionId,
    outerAgentId,
    outerToolUseId,
    outerDescription,
    outerTaskToolUseAt,
    outerNotification,
    innerAgentId,
    innerToolUseId,
    innerDescription,
    innerTaskToolUseAt,
    innerNotification,
  }: {
    sessionId: string;
    outerAgentId: string;
    outerToolUseId: string;
    outerDescription: string;
    outerTaskToolUseAt: string;
    outerNotification?: { at: string; durationMs?: number };
    innerAgentId: string;
    innerToolUseId: string;
    innerDescription: string;
    innerTaskToolUseAt: string;
    innerNotification?: { at: string; durationMs?: number };
  }): Promise<void> => {
    const jsonlDir = getJsonlDir();
    const kickoffAt = offsetIso({ at: outerTaskToolUseAt, ms: -KICKOFF_LEAD_MS });
    const outerCompletedAt = offsetIso({ at: outerTaskToolUseAt, ms: OUTER_COMPLETION_LAG_MS });
    const innerCompletedAt = offsetIso({ at: innerTaskToolUseAt, ms: INNER_COMPLETION_LAG_MS });

    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({
          message: { role: 'user', content: 'Kick off nested sub-agent work' },
        }),
        timestamp: kickoffAt,
      }),
      JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: outerToolUseId,
                name: 'Task',
                input: { description: outerDescription, prompt: 'Do the outer work' },
              },
            ],
          },
        }),
        timestamp: outerTaskToolUseAt,
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: outerToolUseId, content: 'launched' }],
          },
          toolUseResult: { agentId: outerAgentId },
        }),
        timestamp: outerCompletedAt,
      }),
      ...(outerNotification === undefined
        ? []
        : [
            buildNotificationLine({
              agentId: outerAgentId,
              taskToolUseId: outerToolUseId,
              at: outerNotification.at,
              ...(outerNotification.durationMs === undefined
                ? {}
                : { durationMs: outerNotification.durationMs }),
            }),
          ]),
    ];

    await fs.promises.mkdir(jsonlDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(jsonlDir, `${sessionId}.jsonl`),
      `${mainLines.join('\n')}\n`,
    );

    const outerSubagentDir = path.join(jsonlDir, sessionId, 'subagents');
    await fs.promises.mkdir(outerSubagentDir, { recursive: true });

    const outerLines = [
      JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: { role: 'assistant', content: [{ type: 'text', text: 'Outer agent body' }] },
        }),
        timestamp: outerTaskToolUseAt,
      }),
      JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: innerToolUseId,
                name: 'Task',
                input: { description: innerDescription, prompt: 'Do the inner work' },
              },
            ],
          },
        }),
        timestamp: innerTaskToolUseAt,
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: innerToolUseId, content: 'launched' }],
          },
          toolUseResult: { agentId: innerAgentId },
        }),
        timestamp: innerCompletedAt,
      }),
      ...(innerNotification === undefined
        ? []
        : [
            buildNotificationLine({
              agentId: innerAgentId,
              taskToolUseId: innerToolUseId,
              at: innerNotification.at,
              ...(innerNotification.durationMs === undefined
                ? {}
                : { durationMs: innerNotification.durationMs }),
            }),
          ]),
    ];

    await fs.promises.writeFile(
      path.join(outerSubagentDir, `agent-${outerAgentId}.jsonl`),
      `${outerLines.join('\n')}\n`,
    );

    await writeSubagentStub({
      jsonlDir,
      sessionId,
      agentId: innerAgentId,
      at: innerTaskToolUseAt,
      text: 'Inner agent body',
    });
  };

  return {
    beforeEach: cleanSessionDirectory,
    afterEach: cleanSessionDirectory,
    seedChain,
    appendNotification,
    seedNestedChain,
  };
};
