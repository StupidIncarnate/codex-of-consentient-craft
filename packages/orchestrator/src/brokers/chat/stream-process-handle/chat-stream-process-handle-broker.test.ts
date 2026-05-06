import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
  ProcessIdStub,
  SessionIdStub,
  SystemInitStreamLineStub,
  TaskToolResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { chatStreamProcessHandleBroker } from './chat-stream-process-handle-broker';
import { chatStreamProcessHandleBrokerProxy } from './chat-stream-process-handle-broker.proxy';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const UUID1 = '00000000-0000-4000-8000-000000000001' as const;
const TS = '2025-01-01T00:00:00.000Z';

describe('chatStreamProcessHandleBroker', () => {
  describe('plain-text fallback (claudeLineNormalizeBroker returns null)', () => {
    it('VALID: {rawLine: "ward output"} => onEntries fires with single assistant-text fallback entry', () => {
      const proxy = chatStreamProcessHandleBrokerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      proxy.setupTimestamps({ timestamps: [TS] });

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'sess-fallback' });
      const chatProcessId = ProcessIdStub({ value: 'proc-fallback' });

      const calls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        sessionId,
        onEntries: ({ chatProcessId: cpid, entries, sessionId: sid }) => {
          calls.push({ chatProcessId: cpid, entries, sessionId: sid });
        },
        onText: () => {},
        onSignal: () => {},
      });

      handle.onLine({ rawLine: 'lint @dungeonmaster/shared PASS  42 files' });

      expect(calls).toStrictEqual([
        {
          chatProcessId: 'proc-fallback',
          sessionId: 'sess-fallback',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'lint @dungeonmaster/shared PASS  42 files',
              uuid: UUID1,
              timestamp: TS,
            },
          ],
        },
      ]);
    });

    it('EMPTY: {rawLine: ""} => onEntries never fires', () => {
      chatStreamProcessHandleBrokerProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-empty' });
      const calls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: (params) => {
          calls.push(params);
        },
        onText: () => {},
        onSignal: () => {},
      });

      handle.onLine({ rawLine: '' });

      expect(calls).toStrictEqual([]);
    });
  });

  describe('Claude JSON lines (parsed object)', () => {
    it('VALID: {rawLine: assistant text JSON} => onEntries fires with parsed entries', () => {
      chatStreamProcessHandleBrokerProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'sess-text' });
      const chatProcessId = ProcessIdStub({ value: 'proc-text' });

      const calls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        sessionId,
        onEntries: (params) => {
          calls.push(params);
        },
        onText: () => {},
        onSignal: () => {},
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'Hello there' }],
              },
            }),
            uuid: 'line-uuid-text-1',
            timestamp: '2025-01-01T00:00:00Z',
          },
        }),
      });

      expect(calls).toStrictEqual([
        {
          chatProcessId: 'proc-text',
          sessionId: 'sess-text',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'Hello there',
              uuid: 'line-uuid-text-1:0',
              timestamp: '2025-01-01T00:00:00Z',
              source: 'session',
            },
          ],
        },
      ]);
    });

    it('VALID: {system/init line first then assistant text} => second emit carries memoized sessionId from init', () => {
      chatStreamProcessHandleBrokerProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-init' });
      const calls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: ({ sessionId: sid, entries }) => {
          calls.push({ sessionId: sid, entryCount: entries.length });
        },
        onText: () => {},
        onSignal: () => {},
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: SystemInitStreamLineStub({ session_id: 'session-init-xyz' }),
        }),
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'After init' }],
              },
            }),
            uuid: 'line-uuid-after-init',
            timestamp: '2025-01-01T00:00:00Z',
          },
        }),
      });

      expect(calls).toStrictEqual([
        {
          sessionId: 'session-init-xyz',
          entryCount: 1,
        },
      ]);
    });
  });

  describe('sub-agent dispatch', () => {
    it('VALID: {parent emits Task tool_use + tool_result with toolUseResult.agentId after init} => agent-detected starts chatSubagentTailBroker; sub-agent line tails through onEntries with source=subagent and agentId=toolUseId', async () => {
      const proxy = chatStreamProcessHandleBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-subagent' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupSubagentGuild({ config, homeDir: '/home/user' });
      proxy.setupSubagentLines({
        lines: [
          streamLineToJsonLineTransformer({
            streamLine: {
              ...AssistantTextStreamLineStub({
                message: {
                  role: 'assistant',
                  content: [{ type: 'text', text: 'sub-agent says hello' }],
                },
              }),
              uuid: 'line-uuid-sub',
              timestamp: '2025-01-01T00:00:01Z',
            },
          }),
        ],
      });

      const allEntries: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: ({ entries }) => {
          allEntries.push(...entries);
        },
        onText: () => {},
        onSignal: () => {},
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: SystemInitStreamLineStub({ session_id: 'session-sub-xyz' }),
        }),
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantTaskToolUseStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_01TaskDispatch7890abcd',
                    name: 'Task',
                    input: {
                      description: 'Explore the auth flow',
                      subagent_type: 'general-purpose',
                      prompt: 'Do the research',
                    },
                  },
                ],
              },
            }),
            uuid: 'line-uuid-task',
            timestamp: '2025-01-01T00:00:02Z',
          },
        }),
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...TaskToolResultStreamLineStub({
              message: {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: 'toolu_01TaskDispatch7890abcd',
                    content: 'done',
                  },
                ],
              },
              toolUseResult: { agentId: 'realagent-internal-id' },
            }),
            uuid: 'line-uuid-task-result',
            timestamp: '2025-01-01T00:00:03Z',
          },
        }),
      });

      // Let the chatSubagentTailBroker setup (mkdir + appendFile + fs.watch) settle so
      // the watch listener is captured by the proxy before triggerSubagentChange fires.
      await flushImmediate();
      await flushImmediate();

      proxy.triggerSubagentChange();
      await flushImmediate();

      expect(allEntries).toStrictEqual([
        // Parent Task tool_use entry — eagerly stamped with agentId = item.id (toolUseId).
        // `toolInput` is JSON-stringified by streamJsonToChatEntryTransformer, keys camelCased.
        {
          role: 'assistant',
          type: 'tool_use',
          toolName: 'Task',
          toolUseId: 'toolu_01TaskDispatch7890abcd',
          toolInput:
            '{"description":"Explore the auth flow","subagentType":"general-purpose","prompt":"Do the research"}',
          uuid: 'line-uuid-task:0',
          timestamp: '2025-01-01T00:00:02Z',
          source: 'session',
          agentId: 'toolu_01TaskDispatch7890abcd',
        },
        // Parent's tool_result entry — emitted as role:'assistant' type:'tool_result' by
        // mapContentItemToChatEntryTransformer; the toolUseId is carried in `toolName`.
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_01TaskDispatch7890abcd',
          content: 'done',
          uuid: 'line-uuid-task-result:0',
          timestamp: '2025-01-01T00:00:03Z',
          source: 'session',
        },
        // Sub-agent line — tailed via chatSubagentTailBroker, stamped with source=subagent
        // and agentId = parent Task's toolUseId (NOT the realAgentId).
        {
          role: 'assistant',
          type: 'text',
          content: 'sub-agent says hello',
          source: 'subagent',
          agentId: 'toolu_01TaskDispatch7890abcd',
          uuid: 'line-uuid-sub:0',
          timestamp: '2025-01-01T00:00:01Z',
        },
      ]);
    });

    it('VALID: {handle.stop() called after sub-agent setup} => no further sub-agent entries flow through onEntries', async () => {
      const proxy = chatStreamProcessHandleBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-stop' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupSubagentGuild({ config, homeDir: '/home/user' });
      proxy.setupSubagentLines({ lines: [] });

      const allCapturedEntries: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: ({ entries }) => {
          allCapturedEntries.push(...entries);
        },
        onText: () => {},
        onSignal: () => {},
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: SystemInitStreamLineStub({ session_id: 'session-stop' }),
        }),
      });
      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantTaskToolUseStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_stop_dispatch',
                    name: 'Task',
                    input: {
                      description: 'Explore the auth flow',
                      subagent_type: 'general-purpose',
                      prompt: 'Do the research',
                    },
                  },
                ],
              },
            }),
            uuid: 'line-uuid-task-stop',
            timestamp: '2025-01-01T00:00:02Z',
          },
        }),
      });
      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...TaskToolResultStreamLineStub({
              message: {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: 'toolu_stop_dispatch',
                    content: 'done',
                  },
                ],
              },
              toolUseResult: { agentId: 'realagent-stop' },
            }),
            uuid: 'line-uuid-task-stop-result',
            timestamp: '2025-01-01T00:00:03Z',
          },
        }),
      });

      // Wait for the sub-agent tail's broker setup to settle before snapshotting.
      await flushImmediate();
      await flushImmediate();

      const snapshotBeforeStop = [...allCapturedEntries];

      handle.stop();

      proxy.setupSubagentLines({
        lines: [
          streamLineToJsonLineTransformer({
            streamLine: {
              ...AssistantTextStreamLineStub({
                message: {
                  role: 'assistant',
                  content: [{ type: 'text', text: 'arrived after stop' }],
                },
              }),
              uuid: 'line-uuid-after-stop',
              timestamp: '2025-01-01T00:00:04Z',
            },
          }),
        ],
      });
      proxy.triggerSubagentChange();
      await flushImmediate();

      expect(allCapturedEntries).toStrictEqual(snapshotBeforeStop);
    });
  });

  describe('onText callback', () => {
    it('VALID: {plain-text fallback line} => onText fires once with rawLine wrapped as StreamText', () => {
      const proxy = chatStreamProcessHandleBrokerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      proxy.setupTimestamps({ timestamps: [TS] });

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-text-fallback' });

      const textCalls: unknown[] = [];
      const signalCalls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: () => {},
        onText: ({ chatProcessId: cpid, text }) => {
          textCalls.push({ chatProcessId: cpid, text });
        },
        onSignal: (params) => {
          signalCalls.push(params);
        },
      });

      handle.onLine({ rawLine: 'lint @dungeonmaster/shared PASS  42 files' });

      expect(textCalls).toStrictEqual([
        {
          chatProcessId: 'proc-text-fallback',
          text: 'lint @dungeonmaster/shared PASS  42 files',
        },
      ]);
      expect(signalCalls).toStrictEqual([]);
    });

    it('VALID: {assistant text JSON line} => onText fires once with extracted text', () => {
      chatStreamProcessHandleBrokerProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-text-json' });

      const textCalls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: () => {},
        onText: ({ chatProcessId: cpid, text }) => {
          textCalls.push({ chatProcessId: cpid, text });
        },
        onSignal: () => {},
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'Hello there' }],
              },
            }),
            uuid: 'line-uuid-text-fire',
            timestamp: '2025-01-01T00:00:00Z',
          },
        }),
      });

      expect(textCalls).toStrictEqual([
        {
          chatProcessId: 'proc-text-json',
          text: 'Hello there',
        },
      ]);
    });

    it('EMPTY: {assistant tool_use JSON line with no text content} => onText does not fire', () => {
      chatStreamProcessHandleBrokerProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-text-no-fire' });

      const textCalls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: () => {},
        onText: (params) => {
          textCalls.push(params);
        },
        onSignal: () => {},
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_01nofire',
                    name: 'Bash',
                    input: { command: 'ls' },
                  },
                ],
              },
            }),
            uuid: 'line-uuid-no-text',
            timestamp: '2025-01-01T00:00:00Z',
          },
        }),
      });

      expect(textCalls).toStrictEqual([]);
    });
  });

  describe('onSignal callback', () => {
    it('VALID: {assistant signal-back tool_use line} => onSignal fires once with parsed StreamSignal', () => {
      chatStreamProcessHandleBrokerProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-signal' });

      const signalCalls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: () => {},
        onText: () => {},
        onSignal: ({ chatProcessId: cpid, signal }) => {
          signalCalls.push({ chatProcessId: cpid, signal });
        },
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_01signalback',
                    name: 'mcp__dungeonmaster__signal-back',
                    input: { signal: 'complete', summary: 'Quest plan ready' },
                  },
                ],
              },
            }),
            uuid: 'line-uuid-signal',
            timestamp: '2025-01-01T00:00:00Z',
          },
        }),
      });

      expect(signalCalls).toStrictEqual([
        {
          chatProcessId: 'proc-signal',
          signal: {
            signal: 'complete',
            summary: 'Quest plan ready',
          },
        },
      ]);
    });

    it('EMPTY: {assistant text JSON line} => onSignal does not fire', () => {
      chatStreamProcessHandleBrokerProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-no-signal' });

      const signalCalls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: () => {},
        onText: () => {},
        onSignal: (params) => {
          signalCalls.push(params);
        },
      });

      handle.onLine({
        rawLine: streamLineToJsonLineTransformer({
          streamLine: {
            ...AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'No signal here' }],
              },
            }),
            uuid: 'line-uuid-no-signal',
            timestamp: '2025-01-01T00:00:00Z',
          },
        }),
      });

      expect(signalCalls).toStrictEqual([]);
    });

    it('EMPTY: {plain-text fallback line} => onSignal does not fire', () => {
      const proxy = chatStreamProcessHandleBrokerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      proxy.setupTimestamps({ timestamps: [TS] });

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'proc-fallback-no-signal' });

      const signalCalls: unknown[] = [];

      const handle = chatStreamProcessHandleBroker({
        chatProcessId,
        guildId,
        onEntries: () => {},
        onText: () => {},
        onSignal: (params) => {
          signalCalls.push(params);
        },
      });

      handle.onLine({ rawLine: 'plain ward output line' });

      expect(signalCalls).toStrictEqual([]);
    });
  });
});
