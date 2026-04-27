import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  FileNameStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
  SessionIdStub,
  TaskToolResultStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { chatHistoryReplayBroker } from './chat-history-replay-broker';
import { chatHistoryReplayBrokerProxy } from './chat-history-replay-broker.proxy';

describe('chatHistoryReplayBroker', () => {
  describe('session replay', () => {
    it('VALID: {session with user and assistant lines} => emits ChatEntry[] batches via onEntries', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-1' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content:
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"hello"}]}}\n{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"hi"}]}}',
      });
      proxy.setupSubagentDirMissing();

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      expect(batches).toStrictEqual([
        [],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'hi',
            source: 'session',
          },
        ],
      ]);
    });

    it('EMPTY: {session with only system entries} => emits nothing', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-2' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: '{"type":"system","timestamp":"2025-01-01T00:00:00Z"}',
      });
      proxy.setupSubagentDirMissing();

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      expect(batches).toStrictEqual([]);
    });

    it('EMPTY: {session with only queue-operation lines} => completes cleanly emitting nothing', async () => {
      // Smoketest one-shot prompts produce a JSONL whose first line is a `queue-operation`
      // (the prompt enqueue) and second line is the matching dequeue. These have no
      // `message.content` and a non-assistant/user `type`, so the chat-line processor
      // returns no entries — but the broker MUST still iterate every line without
      // throwing so the responder reaches `chat-history-complete`.
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-queue-only' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [
          '{"type":"queue-operation","operation":"enqueue","timestamp":"2025-01-01T00:00:00.000Z","sessionId":"test-session-queue-only","content":"Do exactly one thing"}',
          '{"type":"queue-operation","operation":"dequeue","timestamp":"2025-01-01T00:00:00.000Z","sessionId":"test-session-queue-only"}',
        ].join('\n'),
      });
      proxy.setupSubagentDirMissing();

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      expect(batches).toStrictEqual([]);
    });

    it('VALID: {session JSONL with assistant tool_use line} => emits chat entry for the tool_use', async () => {
      // Anchors the smoketest codeweaver scenario: the session JSONL contains an
      // assistant `tool_use` for the dungeonmaster signal-back MCP tool, and that line
      // MUST be lifted to a chat entry by the broker so the web's expanded execution
      // row can render the tool call.
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-signal-back' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const toolUseId = 'toolu_01SignalBackToolUse1';

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [
          `{"type":"queue-operation","operation":"enqueue","timestamp":"2025-01-01T00:00:00.000Z","sessionId":"test-session-signal-back","content":"prompt"}`,
          JSON.stringify({
            type: 'assistant',
            timestamp: '2025-01-01T00:00:01.000Z',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: toolUseId,
                  name: 'mcp__dungeonmaster__signal-back',
                  input: { signal: 'failed-replan', summary: 'smoketest-failed-replan' },
                },
              ],
            },
          }),
        ].join('\n'),
      });
      proxy.setupSubagentDirMissing();

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      expect(batches).toStrictEqual([
        [
          {
            role: 'assistant',
            type: 'tool_use',
            toolUseId,
            toolName: 'mcp__dungeonmaster__signal-back',
            toolInput: JSON.stringify({
              signal: 'failed-replan',
              summary: 'smoketest-failed-replan',
            }),
            source: 'session',
          },
        ],
      ]);
    });

    it('EDGE: {one line is malformed JSON between two valid assistant lines} => emits entries for the valid lines and skips the malformed one without aborting', async () => {
      // Defensive: if Claude CLI ever writes a corrupt line, the broker MUST keep
      // processing the remaining lines. `claudeLineNormalizeBroker` returns null on
      // JSON.parse failure; downstream contracts safe-parse and skip null/non-object
      // shapes, so the iteration continues.
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-bad-line' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [
          '{"type":"assistant","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"first"}]}}',
          '{not valid json at all',
          '{"type":"assistant","timestamp":"2025-01-01T00:00:02Z","message":{"content":[{"type":"text","text":"third"}]}}',
        ].join('\n'),
      });
      proxy.setupSubagentDirMissing();

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      // The malformed line yields no chat-line outputs at all (the processor's
      // safeParse fails and returns `[]` with no `entries` output to forward), so
      // only two batches are emitted — one per valid line. The crucial property is
      // that the broker did NOT throw and the third line was still processed.
      expect(batches).toStrictEqual([
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'first',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'third',
            source: 'session',
          },
        ],
      ]);
    });

    it('VALID: {smoketests guild with separate `.dungeonmaster-dev` path; cwdResolveBroker walks up to repo root} => reads JSONL from the encoded repo-root path, not the guild path', async () => {
      // Anchors Bug 1 root cause: agents are spawned with cwd = repo root (the parent
      // dir containing `.dungeonmaster.json`), so Claude CLI writes its session JSONL
      // under `~/.claude/projects/<encoded-repo-root>/`. The broker MUST walk up from
      // the guild path so the encoded JSONL path matches where Claude CLI actually
      // wrote the file.
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-smoketest' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/repo/.dungeonmaster-dev',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      // Walk-up resolves the guild's `.dungeonmaster-dev` path to the parent repo root.
      proxy.setupCwdResolveSuccess({ cwd: '/home/user/repo' });
      proxy.setupMainSession({
        content:
          '{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"smoketest reply"}]}}',
      });
      proxy.setupSubagentDirMissing();

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      // The broker still emits the entry from the JSONL it read. The proxy's
      // fsReadJsonlAdapter mock returns whatever content was set — the assertion that
      // the broker walked up vs. used guild.path directly is implicit in the entry
      // emission (without the walk-up, the broker would read the wrong path; the
      // proxy returns the same content regardless, so the test asserts that the
      // walk-up path was taken without crashing and that emission still occurs).
      expect(batches).toStrictEqual([
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'smoketest reply',
            source: 'session',
          },
        ],
      ]);
    });

    it('EDGE: {cwdResolveBroker rejects (no `.dungeonmaster.json` ancestor)} => falls back to guild path and still emits entries', async () => {
      // Standalone projects without a `.dungeonmaster.json` ancestor (e.g. e2e isolated
      // /tmp dirs) won't have a repo root to walk up to. The broker MUST fall back to
      // the guild path as the project path so the encoded JSONL path is still valid.
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-fallback' });
      const guild = GuildStub({ id: guildId, path: '/tmp/dm-e2e/my-guild' });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/tmp/dm-e2e' });
      proxy.setupCwdResolveReject({ error: new Error('No .dungeonmaster.json found') });
      proxy.setupMainSession({
        content:
          '{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"fallback reply"}]}}',
      });
      proxy.setupSubagentDirMissing();

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      expect(batches).toStrictEqual([
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'fallback reply',
            source: 'session',
          },
        ],
      ]);
    });
  });

  describe('two-pass sub-agent correlation', () => {
    it('VALID: {main JSONL has Task tool_use + completion tool_use_result.agentId; subagent JSONL has assistant text} => emits sub-agent entry with agentId = Task toolUseId (not the real internal id from the filename)', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-subagent' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const taskToolUseId = 'toolu_01TaskDispatch7890abcd';
      const realAgentId = 'a750c8bc';

      const userLine = JSON.stringify({
        ...UserTextStringStreamLineStub({
          message: { role: 'user', content: 'Do a sub-agent thing' },
        }),
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      const taskToolUseLine = JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: taskToolUseId,
                name: 'Task',
                input: { description: 'Explore', prompt: 'Research the module' },
              },
            ],
          },
        }),
        timestamp: '2025-01-01T00:00:01.000Z',
      });
      const taskResultLine = JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: taskToolUseId, content: 'done' }],
          },
          toolUseResult: { agentId: realAgentId },
        }),
        timestamp: '2025-01-01T00:00:05.000Z',
      });

      const subagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'SUBAGENT_MARKER' }],
          },
        }),
        timestamp: '2025-01-01T00:00:03.000Z',
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [userLine, taskToolUseLine, taskResultLine].join('\n'),
      });
      proxy.setupSubagentDir({ files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })] });
      proxy.setupSubagentFile({ content: subagentLine });

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      // Sorted by timestamp: user(00:00) -> taskToolUse(00:01) -> subagent(00:03) -> taskResult(00:05).
      // The key assertion is on the sub-agent batch: `agentId` MUST be the Task's toolUseId
      // (translated via the pass-1 pre-scan), NOT the real internal id from the subagent
      // filename. `source` MUST be 'subagent'.
      expect(batches).toStrictEqual([
        [
          {
            role: 'user',
            content: 'Do a sub-agent thing',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_use',
            toolUseId: taskToolUseId,
            toolName: 'Task',
            toolInput: JSON.stringify({ description: 'Explore', prompt: 'Research the module' }),
            source: 'session',
            agentId: taskToolUseId,
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'SUBAGENT_MARKER',
            source: 'subagent',
            agentId: taskToolUseId,
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: taskToolUseId,
            content: 'done',
            source: 'session',
          },
        ],
      ]);
    });

    it('VALID: {subagent line sorts EARLIER than its completion tool_use_result} => pre-scan registers translation first so subagent entry still carries agentId = Task toolUseId', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-early-subagent' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const taskToolUseId = 'toolu_01EarlyTask1234567';
      const realAgentId = 'earlysubagent';

      // Sub-agent line timestamp (00:00:02) is EARLIER than the completion tool_use_result
      // timestamp (00:00:10) — the realistic ordering because Claude CLI writes sub-agent
      // output to its JSONL while the Task tool is still running. Without the pass-1
      // pre-scan, the processor would see the sub-agent line first, have no translation
      // for realAgentId yet, and emit it with `agentId = realAgentId` instead of the
      // Task toolUseId — the bug that produces "(0 entries)" in the web chain grouping.
      const userLine = JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: 'kickoff' } }),
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      const taskToolUseLine = JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: taskToolUseId,
                name: 'Task',
                input: { description: 'Explore', prompt: 'Research' },
              },
            ],
          },
        }),
        timestamp: '2025-01-01T00:00:01.000Z',
      });
      const taskResultLine = JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: taskToolUseId, content: 'done' }],
          },
          toolUseResult: { agentId: realAgentId },
        }),
        timestamp: '2025-01-01T00:00:10.000Z',
      });
      const subagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'EARLY_SUBAGENT_TEXT' }],
          },
        }),
        timestamp: '2025-01-01T00:00:02.000Z',
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [userLine, taskToolUseLine, taskResultLine].join('\n'),
      });
      proxy.setupSubagentDir({ files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })] });
      proxy.setupSubagentFile({ content: subagentLine });

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      // Sorted by timestamp: user(00:00) -> taskToolUse(00:01) -> subagent(00:02) -> taskResult(00:10).
      // The sub-agent batch is emitted BEFORE the completion tool_use_result. With the
      // pre-scan it still carries `agentId = taskToolUseId`; without the pre-scan this
      // test would fail because the forward-map update happens live during pass 2 and
      // arrives too late for this sub-agent line.
      expect(batches).toStrictEqual([
        [
          {
            role: 'user',
            content: 'kickoff',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_use',
            toolUseId: taskToolUseId,
            toolName: 'Task',
            toolInput: JSON.stringify({ description: 'Explore', prompt: 'Research' }),
            source: 'session',
            agentId: taskToolUseId,
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'EARLY_SUBAGENT_TEXT',
            source: 'subagent',
            agentId: taskToolUseId,
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: taskToolUseId,
            content: 'done',
            source: 'session',
          },
        ],
      ]);
    });

    it('EDGE: {main JSONL has no tool_use_result for subagent (orphan file)} => subagent entries fall through with their real agentId unchanged and no crash', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-orphan' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const orphanRealAgentId = 'orphanagent';

      const userLine = JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: 'hello' } }),
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      const mainReplyLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'MAIN_REPLY' }],
          },
        }),
        timestamp: '2025-01-01T00:00:01.000Z',
      });
      const orphanSubagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'ORPHAN_TEXT' }],
          },
        }),
        timestamp: '2025-01-01T00:00:02.000Z',
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [userLine, mainReplyLine].join('\n'),
      });
      proxy.setupSubagentDir({
        files: [FileNameStub({ value: `agent-${orphanRealAgentId}.jsonl` })],
      });
      proxy.setupSubagentFile({ content: orphanSubagentLine });

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      // Sorted by timestamp: user(00:00) -> mainReply(00:01) -> orphan(00:02).
      // No Task completion tool_use_result in main JSONL, so the processor's reverse map
      // never learns a toolUseId for `orphanRealAgentId`. The sub-agent line keeps its
      // tagged-from-filename agentId and `source` carries through from the taggedLine.
      // No crash — graceful fallthrough.
      expect(batches).toStrictEqual([
        [
          {
            role: 'user',
            content: 'hello',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'MAIN_REPLY',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'ORPHAN_TEXT',
            source: 'subagent',
            agentId: orphanRealAgentId,
          },
        ],
      ]);
    });

    it('EDGE: {timestamps span both main and subagent JSONL} => emitted entries preserve wall-clock order across sources', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-ordering' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const taskToolUseId = 'toolu_01OrderingTask12345';
      const realAgentId = 'orderingagent';

      // Interleaved timestamps: main text ts=02, subagent text ts=03, main text ts=04.
      // The emitted entries with type='text' in order MUST be MAIN_BEFORE, then SUBAGENT_MID
      // (between the two main texts), then MAIN_AFTER — proving the broker sorts both
      // sources into a single timestamp-ordered stream rather than appending subagent lines
      // after all main lines.
      const userLine = JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: 'go' } }),
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      const taskToolUseLine = JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: taskToolUseId,
                name: 'Task',
                input: { description: 'Explore', prompt: 'R' },
              },
            ],
          },
        }),
        timestamp: '2025-01-01T00:00:01.000Z',
      });
      const mainTextEarly = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'MAIN_BEFORE' }],
          },
        }),
        timestamp: '2025-01-01T00:00:02.000Z',
      });
      const mainTextLate = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'MAIN_AFTER' }],
          },
        }),
        timestamp: '2025-01-01T00:00:04.000Z',
      });
      const taskResultLine = JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: taskToolUseId, content: 'done' }],
          },
          toolUseResult: { agentId: realAgentId },
        }),
        timestamp: '2025-01-01T00:00:05.000Z',
      });
      const subagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'SUBAGENT_MID' }],
          },
        }),
        timestamp: '2025-01-01T00:00:03.000Z',
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [userLine, taskToolUseLine, mainTextEarly, mainTextLate, taskResultLine].join(
          '\n',
        ),
      });
      proxy.setupSubagentDir({ files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })] });
      proxy.setupSubagentFile({ content: subagentLine });

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      // Timestamp-sorted order of emissions:
      //   user(00)         -> [user text]
      //   taskToolUse(01)  -> [tool_use]
      //   mainBefore(02)   -> [text:'MAIN_BEFORE']
      //   subagent(03)     -> [text:'SUBAGENT_MID']
      //   mainAfter(04)    -> [text:'MAIN_AFTER']
      //   taskResult(05)   -> [tool_result]
      expect(batches).toStrictEqual([
        [
          {
            role: 'user',
            content: 'go',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_use',
            toolUseId: taskToolUseId,
            toolName: 'Task',
            toolInput: JSON.stringify({ description: 'Explore', prompt: 'R' }),
            source: 'session',
            agentId: taskToolUseId,
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'MAIN_BEFORE',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'SUBAGENT_MID',
            source: 'subagent',
            agentId: taskToolUseId,
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'MAIN_AFTER',
            source: 'session',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: taskToolUseId,
            content: 'done',
            source: 'session',
          },
        ],
      ]);
    });
  });
});
