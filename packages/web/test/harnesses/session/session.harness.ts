/**
 * PURPOSE: Manages session file creation and cleanup for E2E tests
 *
 * USAGE:
 * const sessions = sessionHarness({ guildPath: '/tmp/dm-e2e-test' });
 * await sessions.createSessionFile({ sessionId: 'abc', userMessage: 'Hello' });
 * // afterEach: cleans session directory
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { dmRegistryBroker, recipesHydrationCreateBroker } from '@dungeonmaster/hydration-recipes';
import {
  dmTargetContract,
  sessionFieldsContract,
  subagentFieldsContract,
  taskDescriptionContract,
  toolUseIdContract,
} from '@dungeonmaster/hydration-recipes/contracts';
import type { DmTarget } from '@dungeonmaster/hydration-recipes/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import {
  AbsoluteFilePathStub,
  AskUserQuestionToolResultStreamLineStub,
  AssistantAskUserQuestionStreamLineStub,
  AssistantReadToolUseStreamLineStub,
  AssistantRedactedThinkingStreamLineStub,
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  TaskNotificationUserTextStreamLineStub,
  TaskToolResultStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

const { recipe } = recipesHydrationCreateBroker();

const buildAnsweredClarificationLines = (): ReturnType<typeof JSON.stringify>[] => {
  const toolUseId = 'toolu_e2e_clarify_history';

  return [
    JSON.stringify(
      UserTextStringStreamLineStub({
        message: { role: 'user', content: 'Build the quest feature' },
      }),
    ),
    JSON.stringify(
      AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: "I'll analyze the requirements for this feature." }],
        },
      }),
    ),
    JSON.stringify(
      AssistantAskUserQuestionStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: toolUseId,
              name: 'mcp__dungeonmaster__ask-user-question',
              input: {
                questions: [
                  {
                    question: 'Which database do you want to use?',
                    header: 'Database Selection',
                    options: [
                      {
                        label: 'PostgreSQL',
                        description: 'Relational database with JSONB support',
                      },
                      { label: 'SQLite', description: 'Lightweight file-based database' },
                    ],
                    multiSelect: false,
                  },
                ],
              },
            },
          ],
        },
      }),
    ),
    JSON.stringify(
      AskUserQuestionToolResultStreamLineStub({
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseId,
              content:
                'Questions sent to user. Their answers will arrive as your next user message.',
            },
          ],
        },
      }),
    ),
    JSON.stringify(
      AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: "I'll wait for your response before proceeding." }],
        },
      }),
    ),
    JSON.stringify(
      UserTextStringStreamLineStub({
        message: { role: 'user', content: 'Database Selection: PostgreSQL' },
      }),
    ),
    JSON.stringify(
      AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'Great choice! Phase 1: Setting up PostgreSQL schema. Phase 2: Creating migrations. Phase 3: Wiring up the broker layer.',
            },
          ],
        },
      }),
    ),
  ];
};

export const sessionHarness = ({
  guildPath,
  target,
}: {
  guildPath: string;
  target?: DmTarget;
}): {
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  createSessionFile: (params: { sessionId: string; userMessage: string }) => Promise<void>;
  createMultiEntrySessionFile: (params: { sessionId: string; lines: string[] }) => Promise<void>;
  createSubagentSessionFiles: (params: {
    sessionId: string;
    agentId: string;
    toolUseId: string;
    userMessage: string;
    mainAssistantText: string;
    subagentText: string;
  }) => Promise<void>;
  // Pre-seeds a session where the parent fired a Task tool_use but the user paused
  // the run before its completion `user.tool_result` landed. The subagent JSONL
  // exists on disk (Claude CLI wrote it the moment the Task spawned) with the prompt
  // verbatim as its first user-text line. Tests use this to exercise the replay
  // broker's prompt-match pre-scan: without it, the subagent file's lines key on
  // realAgentId (filename) instead of toolUseId, and the web's chain grouping
  // orphans them as trailing singletons below the chain header.
  createInFlightSubagentSessionFiles: (params: {
    sessionId: string;
    agentId: string;
    toolUseId: string;
    userMessage: string;
    taskDescription: string;
    taskPrompt: string;
    subagentText: string;
  }) => Promise<void>;
  // Pre-seeds a session with MULTIPLE sub-agents where each entry can independently
  // be `completed: true` (parent JSONL has the completion `user.tool_result` linking
  // toolUseId↔agentId via tool_use_result.agentId — pass-1a path) or `completed: false`
  // (no completion line — pass-1b prompt-match path). Mirrors the real-world bug
  // shape where the user paused a quest mid-run after one or more sub-agents had
  // already completed, leaving a mix of paired and unpaired Tasks in the session.
  // Order of subagents in the array determines emission order (timestamps are
  // generated monotonically increasing).
  createMultiSubagentSessionFiles: (params: {
    sessionId: string;
    userMessage: string;
    subagents: readonly {
      agentId: string;
      toolUseId: string;
      taskDescription: string;
      taskPrompt: string;
      subagentText: string;
      completed: boolean;
    }[];
  }) => Promise<void>;
  createSubagentSessionWithInternalTool: (params: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    internalToolUseId: string;
    userMessage: string;
    taskDescription: string;
    subagentToolName: string;
    subagentToolInput: Record<string, unknown>;
    subagentToolResult: string;
  }) => Promise<void>;
  createBackgroundAgentSession: (params: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    userMessage: string;
    taskDescription: string;
    notificationSummary: string;
    notificationResult: string;
  }) => Promise<void>;
  // Pre-seeds a depth-2 nested sub-agent session on disk: sub-agent A (spawned by the
  // main session) itself spawns sub-agent B. The main `<sessionId>.jsonl` fires Task(A)
  // and completes it (registers realA->toolUseIdA). `subagents/agent-<realA>.jsonl` carries
  // A's own text, THEN the Task(B) launch, then B's completion (registers realB->toolUseIdB
  // and the nested parent-chain link). `subagents/agent-<realB>.jsonl` carries B's nested
  // marker text. On replay the broker's PASS 1a/1c pre-scan resolves both translations + the
  // nested parent-chain so B's entries (and the Task(B) launcher) attach to chain B nested
  // inside chain A. Timestamps are monotonically increasing across all three files so the
  // replay's timestamp sort produces Task(A) < Task(B) < B-marker in PASS 2 (chain A must
  // exist before chain B reparents under it).
  //
  // A's own text sorting BEFORE its Task(B) line is load-bearing, not incidental:
  // `collectSubagentChainsTransformer` splices a nested chain in at the position of the Task
  // that launched it, so anything the parent wrote LATER renders below the whole nested chain.
  // Writing first and launching second is what leaves chain B as the last thing in chain A's
  // body, which is the only arrangement where scrolling the transcript to its foot lands INSIDE
  // the nested chain — the precondition every sticky-header measurement depends on.
  createNestedSubagentSessionFiles: (params: {
    sessionId: string;
    parentRealAgentId: string;
    nestedRealAgentId: string;
    parentToolUseId: string;
    nestedToolUseId: string;
    userMessage: string;
    parentDescription: string;
    nestedDescription: string;
    parentText: string;
    nestedText: string;
  }) => Promise<void>;
  // Creates ONLY the sub-agent JSONL (no main session file) so streaming tests can
  // pre-seed what chatSubagentTailBroker will read once agentId correlation fires.
  createSubagentTailOnly: (params: {
    sessionId: string;
    agentId: string;
    assistantText: string;
  }) => Promise<void>;
  // Like createSubagentTailOnly but accepts a pre-built `lines` array so callers can seed
  // multi-entry sub-agent bodies (text → tool_use → tool_result → text, parallel tool_uses,
  // etc.) without forking the harness for every variant. Each entry is a `JSON.stringify(...)`
  // of a stream-line stub. Replay sorts across main+subagent files by timestamp, so callers
  // building multi-line bodies should bake monotonically-increasing `timestamp` fields onto
  // each line via spread. Filename is `agent-${agentId}.jsonl` to match real Claude CLI shape.
  createSubagentTailMultiEntry: (params: {
    sessionId: string;
    agentId: string;
    lines: string[];
  }) => Promise<void>;
  // Append a single line to an existing sub-agent JSONL — simulates Claude CLI writing
  // additional entries while a `run_in_background` agent keeps running after the parent
  // CLI has already exited. Tests use this to verify the streaming sub-agent tail keeps
  // delivering entries past parent CLI exit.
  appendSubagentLine: (params: {
    sessionId: string;
    agentId: string;
    line: string;
  }) => Promise<void>;
  appendMainSessionLine: (params: { sessionId: string; line: string }) => Promise<void>;
  createSessionWithRedactedThinking: (params: {
    sessionId: string;
    assistantText: string;
  }) => Promise<void>;
  cleanSessionFiles: () => Promise<void>;
  cleanSessionDirectory: () => Promise<void>;
  createSessionWithAssistantText: (params: { sessionId: string; text: string }) => Promise<void>;
  createAnsweredClarificationSession: (params: { sessionId: string }) => Promise<void>;
  createSessionFileForQuest: (params: { sessionId: string }) => Promise<void>;
  sessionFileExists: (params: { sessionId: string }) => boolean;
} => {
  const resolvedTarget = (): DmTarget => {
    if (target !== undefined) {
      return target;
    }
    const home = process.env.DUNGEONMASTER_HOME ?? os.homedir();
    return dmTargetContract.parse({ home, claudeHome: home });
  };

  const getJsonlDir = (): AbsoluteFilePath =>
    claudePathSlugEncoderTransformer({
      homeDir: resolvedTarget().claudeHome,
      projectPath: AbsoluteFilePathStub({ value: guildPath }),
    });

  // Writes a session's OWN JSONL lines through dmRegistryBroker's session ingredient — no raw-fs
  // fallback. A shape sessionFieldsContract rejects throws here, naming the field, rather than
  // silently dropping to a hand-rolled fs.writeFile: see questHarness.writeQuestFile's own header
  // for why a fallback that never reports it fired is worse than an unconverted method.
  const writeSessionLines = async ({
    cwd,
    sessionId,
    lines,
  }: {
    cwd: string;
    sessionId: string;
    lines: string[];
  }): Promise<void> => {
    const parsedFields = sessionFieldsContract.safeParse({ sessionId, cwd, lines });
    if (!parsedFields.success) {
      throw new Error(
        `sessionHarness: could not write session "${sessionId}" — the assembled fields do not ` +
          `parse as sessionFieldsContract, so dmRegistryBroker's session ingredient cannot write ` +
          `them: ${parsedFields.error.message}`,
      );
    }

    const plan = recipe(
      {
        name: 'write-session-lines',
        description: 'write session transcript lines via dmRegistryBroker',
      },
      () => [
        dmRegistryBroker.sessions
          .under({ cwd: parsedFields.data.cwd })
          .add(1, (s) => [s[0].setRaw(parsedFields.data)]),
      ],
    )();

    await dmRegistryBroker.run(plan, resolvedTarget());
  };

  // Writes ONE sub-agent's own `agent-<agentId>.jsonl` through dmRegistryBroker's subagent
  // ingredient — no raw-fs fallback, same reasoning as writeSessionLines above.
  //
  // `completed` is always false here, deliberately: the subagent ingredient's `write` route can
  // auto-append the Task-completion correlation line onto the PARENT session when `completed:
  // true`, but that auto-generated line is built through `userToolResultStreamLineContract`,
  // which carries no `uuid`/`timestamp` fields — subagent-write-route-broker.ts's own header names
  // this exactly: "the 'stable per-line uuid/timestamp' dedup property session.harness.ts...
  // describes cannot be reproduced through this shared contract as it stands today — a finding,
  // not a workaround." Every caller here builds its OWN correlation tool_result line, with the
  // uuid/timestamp the orchestrator's replay dedup needs, as part of the SESSION's own `lines` —
  // so the ingredient's auto-append would only write a second, uncorrelated duplicate.
  const writeSubagentLines = async ({
    cwd,
    sessionId,
    agentId,
    toolUseId,
    taskDescription,
    taskPrompt,
    lines,
  }: {
    cwd: string;
    sessionId: string;
    agentId: string;
    toolUseId: string;
    taskDescription: string;
    taskPrompt: string;
    lines: string[];
  }): Promise<void> => {
    const parsedFields = subagentFieldsContract.safeParse({
      agentId,
      toolUseId,
      taskDescription,
      taskPrompt,
      lines,
      completed: false,
      sessionId,
      cwd,
    });
    if (!parsedFields.success) {
      throw new Error(
        `sessionHarness: could not write sub-agent "${agentId}" transcript for session ` +
          `"${sessionId}" — the assembled fields do not parse as subagentFieldsContract, so ` +
          `dmRegistryBroker's subagent ingredient cannot write them: ${parsedFields.error.message}`,
      );
    }

    const plan = recipe(
      {
        name: 'write-subagent-lines',
        description: "write a sub-agent's own transcript lines via dmRegistryBroker",
      },
      () => [
        dmRegistryBroker.subagents
          .under({ cwd: parsedFields.data.cwd, sessionId: parsedFields.data.sessionId })
          .add(1, (a) => [a[0].setRaw(parsedFields.data)]),
      ],
    )();

    await dmRegistryBroker.run(plan, resolvedTarget());
  };

  const createMultiEntrySessionFile = async ({
    sessionId,
    lines,
  }: {
    sessionId: string;
    lines: string[];
  }): Promise<void> => {
    await writeSessionLines({ cwd: guildPath, sessionId, lines });
  };

  const createSessionFile = async ({
    sessionId,
    userMessage,
  }: {
    sessionId: string;
    userMessage: string;
  }): Promise<void> => {
    const entry = JSON.stringify(
      UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
    );
    await createMultiEntrySessionFile({ sessionId, lines: [entry] });
  };

  const createSubagentSessionFiles = async ({
    sessionId,
    agentId,
    toolUseId,
    userMessage,
    mainAssistantText,
    subagentText,
  }: {
    sessionId: string;
    agentId: string;
    toolUseId: string;
    userMessage: string;
    mainAssistantText: string;
    subagentText: string;
  }): Promise<void> => {
    // Stable per-line uuid + timestamp so the orchestrator's dedup-by-uuid stays correct
    // when subscribe-quest triggers replay more than once. Real Claude CLI writes both
    // fields on every JSONL line; the harness must too or the web binding sees two
    // distinct entries per replay (different crypto.randomUUID() per pass) and renders
    // duplicates.
    const baseEpoch = new Date('2026-04-29T20:00:00.000Z').getTime();
    const tsFor = (offsetSeconds: number) =>
      new Date(baseEpoch + offsetSeconds * 1000).toISOString();

    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
        uuid: `${sessionId}-user`,
        timestamp: tsFor(0),
      }),
      JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: toolUseId,
                name: 'Task',
                input: { description: 'Sub-agent work', prompt: 'Do the thing' },
              },
            ],
          },
        }),
        uuid: `${sessionId}-task-toolUse`,
        timestamp: tsFor(1),
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
          toolUseResult: { agentId },
        }),
        uuid: `${sessionId}-task-result`,
        timestamp: tsFor(3),
      }),
      JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: mainAssistantText }],
            usage: { input_tokens: 200, output_tokens: 80 },
          },
        }),
        uuid: `${sessionId}-main-text`,
        timestamp: tsFor(4),
      }),
    ];

    await writeSessionLines({ cwd: guildPath, sessionId, lines: mainLines });

    const subagentLines = [
      JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: subagentText }],
            usage: { input_tokens: 50, output_tokens: 20 },
          },
        }),
        uuid: `${sessionId}-subagent-text`,
        timestamp: tsFor(2),
      }),
    ];

    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId,
      toolUseId,
      taskDescription: 'Sub-agent work',
      taskPrompt: 'Do the thing',
      lines: subagentLines,
    });
  };

  const createInFlightSubagentSessionFiles = async ({
    sessionId,
    agentId,
    toolUseId,
    userMessage,
    taskDescription,
    taskPrompt,
    subagentText,
  }: {
    sessionId: string;
    agentId: string;
    toolUseId: string;
    userMessage: string;
    taskDescription: string;
    taskPrompt: string;
    subagentText: string;
  }): Promise<void> => {
    // Main session JSONL: user kickoff + assistant Task tool_use. NO completion
    // user.tool_result line — that's the in-flight condition. Without the
    // completion, the replay broker's pass-1a (which keys on tool_use_result.agentId)
    // never registers the realAgentId↔toolUseId mapping; pass-1b's prompt-match
    // pairing is the only path that links the subagent file's lines back to the
    // Task's toolUseId.
    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
        timestamp: '2026-04-29T20:00:00.000Z',
      }),
      JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: toolUseId,
                name: 'Agent',
                input: {
                  description: taskDescription,
                  prompt: taskPrompt,
                  subagent_type: 'general-purpose',
                },
              },
            ],
          },
        }),
        timestamp: '2026-04-29T20:00:01.000Z',
      }),
    ];

    await writeSessionLines({ cwd: guildPath, sessionId, lines: mainLines });

    // Subagent JSONL: line 0 is a user-text line whose `message.content` is the
    // taskPrompt verbatim — that's the byte-identical string Claude CLI passes
    // both to the parent's Task.input.prompt AND to the spawned subagent's first
    // line. The replay broker's pass-1b prompt-match scan reads exactly this line
    // when pairing the realAgentId (filename) with the toolUseId.
    const subagentLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({
          message: { role: 'user', content: taskPrompt },
        }),
        timestamp: '2026-04-29T20:00:02.000Z',
      }),
      JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: subagentText }],
            usage: { input_tokens: 50, output_tokens: 20 },
          },
        }),
        timestamp: '2026-04-29T20:00:03.000Z',
      }),
    ];

    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId,
      toolUseId,
      taskDescription,
      taskPrompt,
      lines: subagentLines,
    });
  };

  const createMultiSubagentSessionFiles = async ({
    sessionId,
    userMessage,
    subagents,
  }: {
    sessionId: string;
    userMessage: string;
    subagents: readonly {
      agentId: string;
      toolUseId: string;
      taskDescription: string;
      taskPrompt: string;
      subagentText: string;
      completed: boolean;
    }[];
  }): Promise<void> => {
    // Timestamp generator. The kickoff sits at 00:00; each Task tool_use + its
    // companion subagent activity gets its own minute slot so timestamps stay
    // monotonically increasing across both files (the replay broker sorts every
    // line across main + subagent JSONLs into one timestamp-ordered stream, so
    // overlapping timestamps would scramble emission order across sources).
    const baseEpoch = new Date('2026-04-29T20:00:00.000Z').getTime();
    const ts = (offsetSeconds: number) => new Date(baseEpoch + offsetSeconds * 1000).toISOString();

    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
        timestamp: ts(0),
      }),
    ];

    for (const [idx, sub] of subagents.entries()) {
      const slotStart = (idx + 1) * 60;

      // Parent assistant Task tool_use line — toolUseId is born here.
      mainLines.push(
        JSON.stringify({
          ...AssistantTaskToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: sub.toolUseId,
                  name: 'Agent',
                  input: {
                    description: sub.taskDescription,
                    prompt: sub.taskPrompt,
                    subagent_type: 'general-purpose',
                  },
                },
              ],
            },
          }),
          timestamp: ts(slotStart),
        }),
      );

      // Completion `user.tool_result` line — only emitted when this sub-agent
      // is marked completed. This is the line whose `tool_use_result.agentId`
      // pairs realAgentId↔toolUseId via the replay broker's pass-1a pre-scan.
      // For `completed: false` entries the parent JSONL has no such line, so
      // pass-1a never registers the mapping — pass-1b's prompt-match scan is
      // the only path that links the file back to the Task.
      if (sub.completed) {
        mainLines.push(
          JSON.stringify({
            ...TaskToolResultStreamLineStub({
              message: {
                role: 'user',
                content: [{ type: 'tool_result', tool_use_id: sub.toolUseId, content: 'done' }],
              },
              toolUseResult: { agentId: sub.agentId },
            }),
            timestamp: ts(slotStart + 30),
          }),
        );
      }
    }

    await writeSessionLines({ cwd: guildPath, sessionId, lines: mainLines });

    // Sequential, not Promise.all: planRunBroker's own runner is serial by design (see its
    // header — concurrent file-backed writes race), and each of these is its own separate
    // dmRegistryBroker.run() call, so this reduce keeps that same one-at-a-time discipline
    // rather than firing several runs against the guild's directory at once.
    await Array.from(subagents.entries()).reduce(async (previous, [idx, sub]) => {
      await previous;
      const slotStart = (idx + 1) * 60;
      const subagentLines = [
        JSON.stringify({
          ...UserTextStringStreamLineStub({
            message: { role: 'user', content: sub.taskPrompt },
          }),
          timestamp: ts(slotStart + 1),
        }),
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: sub.subagentText }],
              usage: { input_tokens: 50, output_tokens: 20 },
            },
          }),
          timestamp: ts(slotStart + 2),
        }),
      ];

      await writeSubagentLines({
        cwd: guildPath,
        sessionId,
        agentId: sub.agentId,
        toolUseId: sub.toolUseId,
        taskDescription: sub.taskDescription,
        taskPrompt: sub.taskPrompt,
        lines: subagentLines,
      });
    }, Promise.resolve());
  };

  const createSubagentSessionWithInternalTool = async ({
    sessionId,
    agentId,
    taskToolUseId,
    internalToolUseId,
    userMessage,
    taskDescription,
    subagentToolName,
    subagentToolInput,
    subagentToolResult,
  }: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    internalToolUseId: string;
    userMessage: string;
    taskDescription: string;
    subagentToolName: string;
    subagentToolInput: Record<string, unknown>;
    subagentToolResult: string;
  }): Promise<void> => {
    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
        timestamp: '2026-04-15T20:00:00.000Z',
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
                input: { description: taskDescription, prompt: 'Do the thing' },
              },
            ],
          },
        }),
        timestamp: '2026-04-15T20:00:01.000Z',
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: taskToolUseId, content: 'done' }],
          },
          toolUseResult: { agentId },
        }),
        timestamp: '2026-04-15T20:00:05.000Z',
      }),
    ];

    await writeSessionLines({ cwd: guildPath, sessionId, lines: mainLines });

    const subagentLines = [
      JSON.stringify({
        ...AssistantReadToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: internalToolUseId,
                name: subagentToolName,
                input: subagentToolInput,
              },
            ],
          },
        }),
        timestamp: '2026-04-15T20:00:02.000Z',
      }),
      JSON.stringify({
        ...SuccessfulToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: internalToolUseId,
                content: subagentToolResult,
              },
            ],
          },
        }),
        timestamp: '2026-04-15T20:00:03.000Z',
      }),
    ];

    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId,
      toolUseId: taskToolUseId,
      taskDescription,
      taskPrompt: 'Do the thing',
      lines: subagentLines,
    });
  };

  const createBackgroundAgentSession = async ({
    sessionId,
    agentId,
    taskToolUseId,
    userMessage,
    taskDescription,
    notificationSummary,
    notificationResult,
  }: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    userMessage: string;
    taskDescription: string;
    notificationSummary: string;
    notificationResult: string;
  }): Promise<void> => {
    const notificationContent = [
      '<task-notification>',
      `<task-id>${agentId}</task-id>`,
      `<tool-use-id>${taskToolUseId}</tool-use-id>`,
      '<status>completed</status>',
      `<summary>${notificationSummary}</summary>`,
      `<result>${notificationResult}</result>`,
      '<usage><total_tokens>28054</total_tokens><tool_uses>3</tool_uses><duration_ms>9033</duration_ms></usage>',
      '</task-notification>',
    ].join('\n');

    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
        timestamp: '2026-04-16T00:00:00.000Z',
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
                input: { description: taskDescription, prompt: 'Run background work' },
              },
            ],
          },
        }),
        timestamp: '2026-04-16T00:00:01.000Z',
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: taskToolUseId, content: 'launched' }],
          },
          toolUseResult: { agentId },
        }),
        timestamp: '2026-04-16T00:00:02.000Z',
      }),
      JSON.stringify({
        ...TaskNotificationUserTextStreamLineStub({
          message: { role: 'user', content: notificationContent },
        }),
        timestamp: '2026-04-16T00:00:30.000Z',
      }),
    ];

    await writeSessionLines({ cwd: guildPath, sessionId, lines: mainLines });

    // Stub out the sub-agent JSONL so the replay broker sees the expected sub-agent file
    // layout, even though we don't care about its internal tool calls for this test.
    const subagentLines = [
      JSON.stringify(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Background work body' }],
          },
        }),
      ),
    ];
    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId,
      toolUseId: taskToolUseId,
      taskDescription,
      taskPrompt: 'Run background work',
      lines: subagentLines,
    });
  };

  const createNestedSubagentSessionFiles = async ({
    sessionId,
    parentRealAgentId,
    nestedRealAgentId,
    parentToolUseId,
    nestedToolUseId,
    userMessage,
    parentDescription,
    nestedDescription,
    parentText,
    nestedText,
  }: {
    sessionId: string;
    parentRealAgentId: string;
    nestedRealAgentId: string;
    parentToolUseId: string;
    nestedToolUseId: string;
    userMessage: string;
    parentDescription: string;
    nestedDescription: string;
    parentText: string;
    nestedText: string;
  }): Promise<void> => {
    // Monotonically increasing timestamps across all three files. The replay broker sorts
    // every line across main + subagent JSONLs into one timestamp-ordered PASS 2 stream, so
    // Task(A) must sort before Task(B) which must sort before B's marker for chain A to exist
    // when chain B reparents under it. Completion tool_results sort LAST — their realAgentId
    // pairings are registered in the pre-scan (PASS 1a/1c) before PASS 2 regardless of order.
    const baseEpoch = new Date('2026-05-13T20:00:00.000Z').getTime();
    const tsFor = (offsetSeconds: number) =>
      new Date(baseEpoch + offsetSeconds * 1000).toISOString();

    // MAIN session JSONL: user kickoff, the Task(A) launch, then A's completion tool_result.
    const mainLines = [
      JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
        uuid: `${sessionId}-user`,
        timestamp: tsFor(0),
      }),
      JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: parentToolUseId,
                name: 'Agent',
                input: {
                  description: parentDescription,
                  prompt: 'Parent prompt',
                  subagent_type: 'general-purpose',
                },
              },
            ],
          },
        }),
        uuid: `${sessionId}-task-a`,
        timestamp: tsFor(1),
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: parentToolUseId, content: 'done' }],
          },
          toolUseResult: { agentId: parentRealAgentId },
        }),
        uuid: `${sessionId}-task-a-result`,
        timestamp: tsFor(10),
      }),
    ];

    await writeSessionLines({ cwd: guildPath, sessionId, lines: mainLines });

    // Sub-agent A's JSONL: A's own text, the nested Task(B) launch, then B's completion
    // tool_result (carries tool_use_result.agentId = realB; lives in A's file so the replay
    // pre-scan tags it as a nested parent-chain candidate keyed on container = realA). A writes
    // before it launches, so chain B is the LAST thing in chain A's rendered body — see the
    // interface comment above for why that ordering is the fixture's whole point.
    const agentALines = [
      JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: parentText }],
            usage: { input_tokens: 60, output_tokens: 20 },
          },
        }),
        uuid: `${sessionId}-agent-a-text`,
        timestamp: tsFor(2),
      }),
      JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: nestedToolUseId,
                name: 'Agent',
                input: {
                  description: nestedDescription,
                  prompt: 'Nested prompt',
                  subagent_type: 'general-purpose',
                },
              },
            ],
          },
        }),
        uuid: `${sessionId}-task-b`,
        timestamp: tsFor(3),
      }),
      JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: nestedToolUseId, content: 'done' }],
          },
          toolUseResult: { agentId: nestedRealAgentId },
        }),
        uuid: `${sessionId}-task-b-result`,
        timestamp: tsFor(5),
      }),
    ];

    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId: parentRealAgentId,
      toolUseId: parentToolUseId,
      taskDescription: parentDescription,
      taskPrompt: 'Parent prompt',
      lines: agentALines,
    });

    // Sub-agent B's JSONL: the nested marker text only.
    const agentBLines = [
      JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: nestedText }],
            usage: { input_tokens: 40, output_tokens: 15 },
          },
        }),
        uuid: `${sessionId}-agent-b-marker`,
        timestamp: tsFor(4),
      }),
    ];

    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId: nestedRealAgentId,
      toolUseId: nestedToolUseId,
      taskDescription: nestedDescription,
      taskPrompt: 'Nested prompt',
      lines: agentBLines,
    });
  };

  const createSubagentTailOnly = async ({
    sessionId,
    agentId,
    assistantText,
  }: {
    sessionId: string;
    agentId: string;
    assistantText: string;
  }): Promise<void> => {
    const subagentLines = [
      JSON.stringify(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: assistantText }],
            usage: { input_tokens: 10, output_tokens: 5 },
          },
        }),
      ),
    ];
    // No Task tool_use is ever written on any main session file for this fixture — that's the
    // whole point ("no main session file"), so there is no real toolUseId/taskDescription/
    // taskPrompt to thread through. subagentFieldsContract requires all three regardless (they
    // are the ingredient's own bookkeeping fields, never written into the JSONL content itself),
    // so these are synthetic placeholders nothing reads or asserts on.
    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId,
      toolUseId: toolUseIdContract.parse(`toolu_tail_${agentId}`),
      taskDescription: taskDescriptionContract.parse('Sub-agent tail only'),
      taskPrompt: 'Tail-only fixture',
      lines: subagentLines,
    });
  };

  const createSubagentTailMultiEntry = async ({
    sessionId,
    agentId,
    lines,
  }: {
    sessionId: string;
    agentId: string;
    lines: string[];
  }): Promise<void> => {
    // Same synthetic-placeholder reasoning as createSubagentTailOnly above.
    await writeSubagentLines({
      cwd: guildPath,
      sessionId,
      agentId,
      toolUseId: toolUseIdContract.parse(`toolu_tail_${agentId}`),
      taskDescription: taskDescriptionContract.parse('Sub-agent tail only'),
      taskPrompt: 'Tail-only fixture',
      lines,
    });
  };

  // RAW ON PURPOSE — framework gap, not a fallback. This appends to an agent-<agentId>.jsonl a
  // PRIOR, separate step already created (a dispatched agent already driving, or an earlier
  // harness call in this same test) — a row this plan did not mint. dmRegistryBroker has no verb
  // that reaches a row outside the plan that creates it: hydration-recipes/CLAUDE.md's own "Two
  // known gaps" section names exactly this — "No recipe or ingredient here can modify a row an
  // EARLIER seed step created, addressed only by its id... If a verb is wanted later it is
  // attach({id}) on a collection" — and remaining-build-items.md item 5b tracks the same verb as
  // unbuilt. Do not route this through `.add()` again to fake an append: that mints a SECOND
  // create op against an identity the framework never promised idempotent re-creation for, which
  // is inventing a workaround around the documented gap, not using a route the framework offers.
  const appendSubagentLine = async ({
    sessionId,
    agentId,
    line,
  }: {
    sessionId: string;
    agentId: string;
    line: string;
  }): Promise<void> => {
    const jsonlDir = getJsonlDir();
    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    // Ensure the subagent directory exists. On a brand-new chat the orchestrator may
    // try to start the watcher before Claude CLI has created either the session
    // directory or the subagent directory; this matches that real-world race by
    // creating the dir on append rather than requiring the test to pre-seed it.
    await fs.promises.mkdir(subagentDir, { recursive: true });
    await fs.promises.appendFile(path.join(subagentDir, `agent-${agentId}.jsonl`), `${line}\n`);
  };

  // RAW ON PURPOSE — same framework gap as appendSubagentLine above: this appends to a
  // <sessionId>.jsonl a prior step already created (or that a dispatched agent is already
  // driving), and dmRegistryBroker has no `attach({id})` verb to reach it.
  const appendMainSessionLine = async ({
    sessionId,
    line,
  }: {
    sessionId: string;
    line: string;
  }): Promise<void> => {
    const jsonlDir = getJsonlDir();
    await fs.promises.mkdir(jsonlDir, { recursive: true });
    // Appends to the PARENT session's own `<sessionId>.jsonl`, which the quest-driven watcher
    // tails from `end` — so only lines written AFTER the watcher starts emit. That is exactly the
    // shape of a live intake conversation: the agent writes a turn, the browser panel renders it.
    await fs.promises.appendFile(path.join(jsonlDir, `${sessionId}.jsonl`), `${line}\n`);
  };

  const createSessionWithRedactedThinking = async ({
    sessionId,
    assistantText,
  }: {
    sessionId: string;
    assistantText: string;
  }): Promise<void> => {
    await createMultiEntrySessionFile({
      sessionId,
      lines: [
        JSON.stringify(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: 'Trigger extended-thinking reply' },
          }),
        ),
        JSON.stringify(AssistantRedactedThinkingStreamLineStub()),
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] },
          }),
        ),
      ],
    });
  };

  // RAW ON PURPOSE — teardown, not seeding. dmRegistryBroker's `remove` route deletes ONE record
  // this plan already knows the identity of; it has no glob/bulk verb for "delete whatever is in
  // this directory, whoever wrote it" — the target's contents here may include files this harness
  // never created (a real orchestrator-driven session from an earlier test in the same suite run).
  // seed-census.py's own header agrees: "A test that takes a temp directory... and never builds
  // one is not a target" — cleanup of a directory is the same shape as that exclusion, mirrored.
  const cleanSessionFiles = async (): Promise<void> => {
    const jsonlDir = getJsonlDir();
    try {
      const files = await fs.promises.readdir(jsonlDir);
      const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));
      await Promise.all(
        jsonlFiles.map(async (file) => fs.promises.unlink(path.join(jsonlDir, file))),
      );
    } catch {
      // Directory may not exist
    }
  };

  // RAW ON PURPOSE — same teardown reasoning as cleanSessionFiles above; this is the
  // beforeEach/afterEach hook, wiping the whole per-guild session directory regardless of what
  // wrote into it.
  //
  // `maxRetries`/`retryDelay` are load-bearing, not defensive padding: an aborted-XHR spec's
  // real POST already reached the server before the browser tears down its own request, so the
  // fake Claude CLI it spawned keeps writing (mkdirSync/writeFileSync/appendFileSync) into this
  // SAME directory as an orphan, past the point the test's own assertions return. `fs.rm`'s
  // recursive removal is readdir-then-delete-children-then-rmdir, and a line the orphan appends
  // between the readdir and the final rmdir throws ENOTEMPTY (`syscall: 'rmdir'`, even though
  // nothing here calls `fs.rmdir`) — reproduced live via `send-images-chat-route.e2e.ts`'s
  // "chat POST aborted mid-flight" case. `recursive: true` alone does not retry — Node's default
  // `maxRetries` is 0 — so the race was previously a guaranteed flake whenever the orphan's next
  // write landed inside that window; the retry budget rides out the write.
  const cleanSessionDirectory = async (): Promise<void> => {
    const jsonlDir = getJsonlDir();
    await fs.promises.rm(jsonlDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  };

  const createSessionWithAssistantText = async ({
    sessionId,
    text,
  }: {
    sessionId: string;
    text: string;
  }): Promise<void> => {
    await createMultiEntrySessionFile({
      sessionId,
      lines: [
        JSON.stringify(
          UserTextStringStreamLineStub({ message: { role: 'user', content: 'Build the feature' } }),
        ),
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text }],
              usage: { input_tokens: 100, output_tokens: 50 },
            },
          }),
        ),
      ],
    });
  };

  const createAnsweredClarificationSession = async ({
    sessionId,
  }: {
    sessionId: string;
  }): Promise<void> => {
    await createMultiEntrySessionFile({
      sessionId,
      lines: buildAnsweredClarificationLines(),
    });
  };

  const createSessionFileForQuest = async ({ sessionId }: { sessionId: string }): Promise<void> => {
    await createSessionFile({ sessionId, userMessage: 'Build the feature' });
  };

  // Session JSONL files live under ~/.claude/projects/<encoded-guildPath>/ — outside the
  // dungeonmaster home where quest folders live. A quest delete must NOT touch this tree,
  // so a session file present before the delete must still exist afterward.
  //
  // RAW ON PURPOSE — this is a synchronous boolean READ used directly in an assertion, not a
  // seed operation. dmRegistryBroker has no existence-check verb: `filter` is the nearest route,
  // and it deliberately THROWS on zero matches rather than returning false (a filter matching
  // nothing almost always means a real bug — see hydration/CLAUDE.md's "no-pick rule"), and
  // `run()` is async regardless, so reaching for it here would force this method's signature from
  // a synchronous boolean to a Promise, touching every caller for a call that is fundamentally a
  // fs.existsSync check on a path this harness already knows how to encode.
  const sessionFileExists = ({ sessionId }: { sessionId: string }): boolean =>
    fs.existsSync(path.join(getJsonlDir(), `${sessionId}.jsonl`));

  return {
    beforeEach: cleanSessionDirectory,
    afterEach: cleanSessionDirectory,
    createSessionFile,
    createMultiEntrySessionFile,
    createSubagentSessionFiles,
    createInFlightSubagentSessionFiles,
    createMultiSubagentSessionFiles,
    createNestedSubagentSessionFiles,
    createSubagentSessionWithInternalTool,
    createSubagentTailOnly,
    createSubagentTailMultiEntry,
    appendSubagentLine,
    appendMainSessionLine,
    createBackgroundAgentSession,
    createSessionWithRedactedThinking,
    cleanSessionFiles,
    cleanSessionDirectory,
    createSessionWithAssistantText,
    createAnsweredClarificationSession,
    createSessionFileForQuest,
    sessionFileExists,
  };
};
