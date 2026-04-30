/**
 * PURPOSE: Manages session file creation and cleanup for E2E tests
 *
 * USAGE:
 * const sessions = sessionHarness({ guildPath: '/tmp/dm-e2e-test' });
 * sessions.createSessionFile({ sessionId: 'abc', userMessage: 'Hello' });
 * // afterEach: cleans session directory
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import {
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
}: {
  guildPath: string;
}): {
  afterEach: () => void;
  createSessionFile: (params: { sessionId: string; userMessage: string }) => void;
  createMultiEntrySessionFile: (params: { sessionId: string; lines: string[] }) => void;
  createSubagentSessionFiles: (params: {
    sessionId: string;
    agentId: string;
    toolUseId: string;
    userMessage: string;
    mainAssistantText: string;
    subagentText: string;
  }) => void;
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
  }) => void;
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
  }) => void;
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
  }) => void;
  createBackgroundAgentSession: (params: {
    sessionId: string;
    agentId: string;
    taskToolUseId: string;
    userMessage: string;
    taskDescription: string;
    notificationSummary: string;
    notificationResult: string;
  }) => void;
  // Creates ONLY the sub-agent JSONL (no main session file) so streaming tests can
  // pre-seed what chatSubagentTailBroker will read once agentId correlation fires.
  createSubagentTailOnly: (params: {
    sessionId: string;
    agentId: string;
    assistantText: string;
  }) => void;
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
  }) => void;
  // Append a single line to an existing sub-agent JSONL — simulates Claude CLI writing
  // additional entries while a `run_in_background` agent keeps running after the parent
  // CLI has already exited. Tests use this to verify the streaming sub-agent tail keeps
  // delivering entries past parent CLI exit.
  appendSubagentLine: (params: { sessionId: string; agentId: string; line: string }) => void;
  createSessionWithRedactedThinking: (params: { sessionId: string; assistantText: string }) => void;
  cleanSessionFiles: () => void;
  cleanSessionDirectory: () => void;
  createSessionWithAssistantText: (params: { sessionId: string; text: string }) => void;
  createAnsweredClarificationSession: (params: { sessionId: string }) => void;
  createSessionFileForQuest: (params: { sessionId: string }) => void;
} => {
  const getJsonlDir = (): FilePath => {
    const homeDir = os.homedir();
    const encodedPath = guildPath.replace(/\//gu, '-');
    return path.join(homeDir, '.claude', 'projects', encodedPath) as FilePath;
  };

  const createSessionFile = ({
    sessionId,
    userMessage,
  }: {
    sessionId: string;
    userMessage: string;
  }): void => {
    const jsonlDir = getJsonlDir();
    const jsonlPath = path.join(jsonlDir, `${sessionId}.jsonl`);

    fs.mkdirSync(jsonlDir, { recursive: true });

    const entry = JSON.stringify(
      UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
    );
    fs.writeFileSync(jsonlPath, `${entry}\n`);
  };

  const createMultiEntrySessionFile = ({
    sessionId,
    lines,
  }: {
    sessionId: string;
    lines: string[];
  }): void => {
    const jsonlDir = getJsonlDir();
    const jsonlPath = path.join(jsonlDir, `${sessionId}.jsonl`);

    fs.mkdirSync(jsonlDir, { recursive: true });
    fs.writeFileSync(jsonlPath, `${lines.join('\n')}\n`);
  };

  const createSubagentSessionFiles = ({
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
  }): void => {
    const jsonlDir = getJsonlDir();

    const mainLines = [
      JSON.stringify(
        UserTextStringStreamLineStub({ message: { role: 'user', content: userMessage } }),
      ),
      JSON.stringify(
        AssistantTaskToolUseStreamLineStub({
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
      ),
      JSON.stringify(
        TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
          },
          toolUseResult: { agentId },
        }),
      ),
      JSON.stringify(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: mainAssistantText }],
            usage: { input_tokens: 200, output_tokens: 80 },
          },
        }),
      ),
    ];

    fs.mkdirSync(jsonlDir, { recursive: true });
    fs.writeFileSync(path.join(jsonlDir, `${sessionId}.jsonl`), `${mainLines.join('\n')}\n`);

    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });

    const subagentLines = [
      JSON.stringify(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: subagentText }],
            usage: { input_tokens: 50, output_tokens: 20 },
          },
        }),
      ),
    ];

    // Real Claude CLI writes sub-agent JSONLs as `agent-<realAgentId>.jsonl`. The replay
    // broker's `stripAgentFilenamePrefixTransformer` expects that prefix. Keep the filename
    // consistent with the other harness helpers (createSubagentTailOnly,
    // createSubagentSessionWithInternalTool, createBackgroundAgentSession) so E2E specs
    // exercise the real shape.
    fs.writeFileSync(
      path.join(subagentDir, `agent-${agentId}.jsonl`),
      `${subagentLines.join('\n')}\n`,
    );
  };

  const createInFlightSubagentSessionFiles = ({
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
  }): void => {
    const jsonlDir = getJsonlDir();

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

    fs.mkdirSync(jsonlDir, { recursive: true });
    fs.writeFileSync(path.join(jsonlDir, `${sessionId}.jsonl`), `${mainLines.join('\n')}\n`);

    // Subagent JSONL: line 0 is a user-text line whose `message.content` is the
    // taskPrompt verbatim — that's the byte-identical string Claude CLI passes
    // both to the parent's Task.input.prompt AND to the spawned subagent's first
    // line. The replay broker's pass-1b prompt-match scan reads exactly this line
    // when pairing the realAgentId (filename) with the toolUseId.
    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });

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

    fs.writeFileSync(
      path.join(subagentDir, `agent-${agentId}.jsonl`),
      `${subagentLines.join('\n')}\n`,
    );
  };

  const createMultiSubagentSessionFiles = ({
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
  }): void => {
    const jsonlDir = getJsonlDir();
    fs.mkdirSync(jsonlDir, { recursive: true });

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

    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });

    subagents.forEach((sub, idx) => {
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

      // Subagent JSONL: line 0 is a user-text line whose `message.content`
      // equals the Task's `input.prompt` verbatim — the byte-identical string
      // pass-1b uses to pair this file with its parent Task when no completion
      // exists. Line 1 is an assistant text response carrying the marker.
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

      fs.writeFileSync(
        path.join(subagentDir, `agent-${sub.agentId}.jsonl`),
        `${subagentLines.join('\n')}\n`,
      );
    });

    fs.writeFileSync(path.join(jsonlDir, `${sessionId}.jsonl`), `${mainLines.join('\n')}\n`);
  };

  const createSubagentSessionWithInternalTool = ({
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
  }): void => {
    const jsonlDir = getJsonlDir();

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

    fs.mkdirSync(jsonlDir, { recursive: true });
    fs.writeFileSync(path.join(jsonlDir, `${sessionId}.jsonl`), `${mainLines.join('\n')}\n`);

    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });

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

    fs.writeFileSync(
      path.join(subagentDir, `agent-${agentId}.jsonl`),
      `${subagentLines.join('\n')}\n`,
    );
  };

  const createBackgroundAgentSession = ({
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
  }): void => {
    const jsonlDir = getJsonlDir();
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

    fs.mkdirSync(jsonlDir, { recursive: true });
    fs.writeFileSync(path.join(jsonlDir, `${sessionId}.jsonl`), `${mainLines.join('\n')}\n`);

    // Stub out the sub-agent JSONL so the replay broker sees the expected sub-agent file
    // layout, even though we don't care about its internal tool calls for this test.
    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });
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
    fs.writeFileSync(
      path.join(subagentDir, `agent-${agentId}.jsonl`),
      `${subagentLines.join('\n')}\n`,
    );
  };

  const createSubagentTailOnly = ({
    sessionId,
    agentId,
    assistantText,
  }: {
    sessionId: string;
    agentId: string;
    assistantText: string;
  }): void => {
    const jsonlDir = getJsonlDir();
    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });
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
    fs.writeFileSync(
      path.join(subagentDir, `agent-${agentId}.jsonl`),
      `${subagentLines.join('\n')}\n`,
    );
  };

  const createSubagentTailMultiEntry = ({
    sessionId,
    agentId,
    lines,
  }: {
    sessionId: string;
    agentId: string;
    lines: string[];
  }): void => {
    const jsonlDir = getJsonlDir();
    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    fs.mkdirSync(subagentDir, { recursive: true });
    fs.writeFileSync(path.join(subagentDir, `agent-${agentId}.jsonl`), `${lines.join('\n')}\n`);
  };

  const appendSubagentLine = ({
    sessionId,
    agentId,
    line,
  }: {
    sessionId: string;
    agentId: string;
    line: string;
  }): void => {
    const jsonlDir = getJsonlDir();
    const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
    // Ensure the subagent directory exists. On a brand-new chat the orchestrator may
    // try to start the watcher before Claude CLI has created either the session
    // directory or the subagent directory; this matches that real-world race by
    // creating the dir on append rather than requiring the test to pre-seed it.
    fs.mkdirSync(subagentDir, { recursive: true });
    fs.appendFileSync(path.join(subagentDir, `agent-${agentId}.jsonl`), `${line}\n`);
  };

  const createSessionWithRedactedThinking = ({
    sessionId,
    assistantText,
  }: {
    sessionId: string;
    assistantText: string;
  }): void => {
    createMultiEntrySessionFile({
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

  const cleanSessionFiles = (): void => {
    const jsonlDir = getJsonlDir();
    try {
      const files = fs.readdirSync(jsonlDir).filter((f) => f.endsWith('.jsonl'));
      for (const file of files) {
        fs.unlinkSync(path.join(jsonlDir, file));
      }
    } catch {
      // Directory may not exist
    }
  };

  const cleanSessionDirectory = (): void => {
    const jsonlDir = getJsonlDir();
    fs.rmSync(jsonlDir, { recursive: true, force: true });
  };

  const createSessionWithAssistantText = ({
    sessionId,
    text,
  }: {
    sessionId: string;
    text: string;
  }): void => {
    createMultiEntrySessionFile({
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

  const createAnsweredClarificationSession = ({ sessionId }: { sessionId: string }): void => {
    createMultiEntrySessionFile({
      sessionId,
      lines: buildAnsweredClarificationLines(),
    });
  };

  const createSessionFileForQuest = ({ sessionId }: { sessionId: string }): void => {
    createSessionFile({ sessionId, userMessage: 'Build the feature' });
  };

  return {
    afterEach: cleanSessionDirectory,
    createSessionFile,
    createMultiEntrySessionFile,
    createSubagentSessionFiles,
    createInFlightSubagentSessionFiles,
    createMultiSubagentSessionFiles,
    createSubagentSessionWithInternalTool,
    createSubagentTailOnly,
    createSubagentTailMultiEntry,
    appendSubagentLine,
    createBackgroundAgentSession,
    createSessionWithRedactedThinking,
    cleanSessionFiles,
    cleanSessionDirectory,
    createSessionWithAssistantText,
    createAnsweredClarificationSession,
    createSessionFileForQuest,
  };
};
