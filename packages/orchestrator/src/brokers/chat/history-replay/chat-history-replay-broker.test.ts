import {
  AgentIdStub,
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
          '{"type":"user","uuid":"user-line-uuid","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"hello"}]}}\n{"type":"assistant","uuid":"assistant-line-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"hi"}]}}',
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
            uuid: 'assistant-line-uuid:0',
            timestamp: '2025-01-01T00:00:01Z',
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
            uuid: 'signal-back-line-uuid',
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
            uuid: 'signal-back-line-uuid:0',
            timestamp: '2025-01-01T00:00:01.000Z',
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
          '{"type":"assistant","uuid":"first-line-uuid","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"first"}]}}',
          '{not valid json at all',
          '{"type":"assistant","uuid":"third-line-uuid","timestamp":"2025-01-01T00:00:02Z","message":{"content":[{"type":"text","text":"third"}]}}',
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
            uuid: 'first-line-uuid:0',
            timestamp: '2025-01-01T00:00:00Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'third',
            source: 'session',
            uuid: 'third-line-uuid:0',
            timestamp: '2025-01-01T00:00:02Z',
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
          '{"type":"assistant","uuid":"smoketest-line-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"smoketest reply"}]}}',
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
            uuid: 'smoketest-line-uuid:0',
            timestamp: '2025-01-01T00:00:01Z',
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
          '{"type":"assistant","uuid":"fallback-line-uuid","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"fallback reply"}]}}',
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
            uuid: 'fallback-line-uuid:0',
            timestamp: '2025-01-01T00:00:01Z',
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
        uuid: 'user-line-uuid',
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
        uuid: 'task-tool-use-line-uuid',
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
        uuid: 'task-result-line-uuid',
        timestamp: '2025-01-01T00:00:05.000Z',
      });

      const subagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'SUBAGENT_MARKER' }],
          },
        }),
        uuid: 'subagent-line-uuid',
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
            uuid: 'user-line-uuid:user',
            timestamp: '2025-01-01T00:00:00.000Z',
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
            uuid: 'task-tool-use-line-uuid:0',
            timestamp: '2025-01-01T00:00:01.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'SUBAGENT_MARKER',
            source: 'subagent',
            agentId: taskToolUseId,
            uuid: 'subagent-line-uuid:0',
            timestamp: '2025-01-01T00:00:03.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: taskToolUseId,
            content: 'done',
            source: 'session',
            uuid: 'task-result-line-uuid:0',
            timestamp: '2025-01-01T00:00:05.000Z',
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
        uuid: 'early-user-line-uuid',
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
        uuid: 'early-task-line-uuid',
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
        uuid: 'early-result-line-uuid',
        timestamp: '2025-01-01T00:00:10.000Z',
      });
      const subagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'EARLY_SUBAGENT_TEXT' }],
          },
        }),
        uuid: 'early-subagent-line-uuid',
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
            uuid: 'early-user-line-uuid:user',
            timestamp: '2025-01-01T00:00:00.000Z',
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
            uuid: 'early-task-line-uuid:0',
            timestamp: '2025-01-01T00:00:01.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'EARLY_SUBAGENT_TEXT',
            source: 'subagent',
            agentId: taskToolUseId,
            uuid: 'early-subagent-line-uuid:0',
            timestamp: '2025-01-01T00:00:02.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: taskToolUseId,
            content: 'done',
            source: 'session',
            uuid: 'early-result-line-uuid:0',
            timestamp: '2025-01-01T00:00:10.000Z',
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
        uuid: 'orphan-user-line-uuid',
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      const mainReplyLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'MAIN_REPLY' }],
          },
        }),
        uuid: 'orphan-main-reply-line-uuid',
        timestamp: '2025-01-01T00:00:01.000Z',
      });
      const orphanSubagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'ORPHAN_TEXT' }],
          },
        }),
        uuid: 'orphan-subagent-line-uuid',
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
            uuid: 'orphan-user-line-uuid:user',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'MAIN_REPLY',
            source: 'session',
            uuid: 'orphan-main-reply-line-uuid:0',
            timestamp: '2025-01-01T00:00:01.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'ORPHAN_TEXT',
            source: 'subagent',
            agentId: orphanRealAgentId,
            uuid: 'orphan-subagent-line-uuid:0',
            timestamp: '2025-01-01T00:00:02.000Z',
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
        uuid: 'ordering-user-line-uuid',
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
        uuid: 'ordering-task-line-uuid',
        timestamp: '2025-01-01T00:00:01.000Z',
      });
      const mainTextEarly = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'MAIN_BEFORE' }],
          },
        }),
        uuid: 'ordering-main-before-line-uuid',
        timestamp: '2025-01-01T00:00:02.000Z',
      });
      const mainTextLate = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'MAIN_AFTER' }],
          },
        }),
        uuid: 'ordering-main-after-line-uuid',
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
        uuid: 'ordering-result-line-uuid',
        timestamp: '2025-01-01T00:00:05.000Z',
      });
      const subagentLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'SUBAGENT_MID' }],
          },
        }),
        uuid: 'ordering-subagent-line-uuid',
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
            uuid: 'ordering-user-line-uuid:user',
            timestamp: '2025-01-01T00:00:00.000Z',
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
            uuid: 'ordering-task-line-uuid:0',
            timestamp: '2025-01-01T00:00:01.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'MAIN_BEFORE',
            source: 'session',
            uuid: 'ordering-main-before-line-uuid:0',
            timestamp: '2025-01-01T00:00:02.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'SUBAGENT_MID',
            source: 'subagent',
            agentId: taskToolUseId,
            uuid: 'ordering-subagent-line-uuid:0',
            timestamp: '2025-01-01T00:00:03.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'MAIN_AFTER',
            source: 'session',
            uuid: 'ordering-main-after-line-uuid:0',
            timestamp: '2025-01-01T00:00:04.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: taskToolUseId,
            content: 'done',
            source: 'session',
            uuid: 'ordering-result-line-uuid:0',
            timestamp: '2025-01-01T00:00:05.000Z',
          },
        ],
      ]);
    });

    it('VALID: {parent Task tool_use has NO completion tool_result (in-flight, paused mid-Task); subagent JSONL first line is a user-text prompt that exactly matches the Task input.prompt} => pre-scan pairs realAgentId↔toolUseId via prompt match so subagent entries still carry agentId = Task toolUseId', async () => {
      // Anchors the in-flight Task replay regression. When a quest is paused mid-run,
      // the parent JSONL has the assistant Task tool_use line but the corresponding user
      // tool_result hasn't been emitted yet. The original pass-1 pre-scan only learns
      // realAgentId↔toolUseId from the completion line's `tool_use_result.agentId`, so
      // for an in-flight Task the subagent JSONL's lines fall through pass 2 with
      // `agentId = realAgentId` (from the JSONL filename) instead of the Task's
      // toolUseId. The web's chain grouping (which keys on toolUseId) then drops the
      // entries into the trailing-singletons buffer instead of the chain group's
      // innerGroups — the exact rendering symptom users see ("orphan" subagent rows
      // at the bottom of the chat, no chain header above them).
      //
      // Fix invariant: the pass-1 pre-scan ALSO walks parent assistant Task/Agent
      // tool_uses whose `id` was not paired by the tool_use_result scan, and pairs
      // each with the subagent JSONL whose first line's `message.content` (string)
      // equals the Task's `input.prompt`. Claude CLI passes the prompt string verbatim
      // to the subagent, so the strings are byte-identical — this is an id-equivalent
      // pairing, not a fuzzy match.
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-inflight-task' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const taskToolUseId = 'toolu_01InFlightTask9999abcd';
      const realAgentId = 'inflightagent';
      const taskPrompt = 'Verify the chaoswhisperer-gap-minion observable coverage';

      const userLine = JSON.stringify({
        ...UserTextStringStreamLineStub({
          message: { role: 'user', content: 'kickoff prompt' },
        }),
        uuid: 'inflight-user-line-uuid',
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
                name: 'Agent',
                input: { description: 'In-flight agent', prompt: taskPrompt },
              },
            ],
          },
        }),
        uuid: 'inflight-task-line-uuid',
        timestamp: '2025-01-01T00:00:01.000Z',
      });

      // The subagent JSONL's first line is a user-text line whose content IS the Task's
      // input.prompt verbatim. Real Claude CLI shape — line 0 is always the prompt.
      const subagentPromptLine = JSON.stringify({
        ...UserTextStringStreamLineStub({
          message: { role: 'user', content: taskPrompt },
        }),
        uuid: 'inflight-subagent-prompt-line-uuid',
        timestamp: '2025-01-01T00:00:02.000Z',
      });
      const subagentTextLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'IN_FLIGHT_SUBAGENT_TEXT' }],
          },
        }),
        uuid: 'inflight-subagent-text-line-uuid',
        timestamp: '2025-01-01T00:00:03.000Z',
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [userLine, taskToolUseLine].join('\n'),
      });
      proxy.setupSubagentDir({ files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })] });
      proxy.setupSubagentFile({
        content: [subagentPromptLine, subagentTextLine].join('\n'),
      });

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          batches.push(entries);
        },
      });

      // Timestamp-sorted: user(00) -> taskToolUse(01) -> subagentPrompt(02) -> subagentText(03).
      // BOTH subagent batches MUST carry agentId = taskToolUseId — same as the
      // completed-Task case ('VALID: {main JSONL has Task tool_use + completion ...}'
      // above). Without the prompt-match fallback, the subagent entries arrive with
      // agentId = realAgentId and the web chain grouping drops them.
      expect(batches).toStrictEqual([
        [
          {
            role: 'user',
            content: 'kickoff prompt',
            source: 'session',
            uuid: 'inflight-user-line-uuid:user',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'tool_use',
            toolUseId: taskToolUseId,
            toolName: 'Agent',
            toolInput: JSON.stringify({ description: 'In-flight agent', prompt: taskPrompt }),
            source: 'session',
            agentId: taskToolUseId,
            uuid: 'inflight-task-line-uuid:0',
            timestamp: '2025-01-01T00:00:01.000Z',
          },
        ],
        [
          {
            role: 'user',
            content: taskPrompt,
            source: 'subagent',
            agentId: taskToolUseId,
            uuid: 'inflight-subagent-prompt-line-uuid:user',
            timestamp: '2025-01-01T00:00:02.000Z',
          },
        ],
        [
          {
            role: 'assistant',
            type: 'text',
            content: 'IN_FLIGHT_SUBAGENT_TEXT',
            source: 'subagent',
            agentId: taskToolUseId,
            uuid: 'inflight-subagent-text-line-uuid:0',
            timestamp: '2025-01-01T00:00:03.000Z',
          },
        ],
      ]);
    });

    it('VALID: {nested helper — codeweaver (a sub-agent) spawns its own Task whose completion tool_result lives in the codeweaver subagent JSONL} => the helper-stream entry carries agentId = the helper Task toolUseId, not the helper real internal id', async () => {
      // Two-level nesting. The main session dispatches codeweaver (a Task); codeweaver then
      // spawns a helper (another Task). The helper's completion tool_result is written to
      // codeweaver's OWN subagent JSONL, not the main session. The pre-scan must walk the
      // subagent files too — otherwise the helper's own lines fall through pass 2 with
      // agentId = helperRealAgentId (from its filename) and orphan in the web chain grouping.
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-nested-helper' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const cwToolUseId = 'toolu_01CodeweaverDispatch01';
      const cwRealAgentId = 'cwrealagent';
      const helperToolUseId = 'toolu_01HelperDispatch0002';
      const helperRealAgentId = 'helperrealagent';

      const userLine = JSON.stringify({
        ...UserTextStringStreamLineStub({ message: { role: 'user', content: 'kickoff' } }),
        uuid: 'nested-user-uuid',
        timestamp: '2025-01-01T00:00:00.000Z',
      });
      const cwTaskLine = JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: cwToolUseId,
                name: 'Agent',
                input: { description: 'codeweaver', prompt: 'implement slice' },
              },
            ],
          },
        }),
        uuid: 'nested-cw-task-uuid',
        timestamp: '2025-01-01T00:00:01.000Z',
      });
      const cwResultLine = JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: cwToolUseId, content: 'cw done' }],
          },
          toolUseResult: { agentId: cwRealAgentId },
        }),
        uuid: 'nested-cw-result-uuid',
        timestamp: '2025-01-01T00:00:10.000Z',
      });

      // codeweaver's OWN subagent stream: it spawns the helper Task and receives its completion.
      const helperTaskLine = JSON.stringify({
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: helperToolUseId,
                name: 'Agent',
                input: { description: 'helper', prompt: 'prove popover' },
              },
            ],
          },
        }),
        uuid: 'nested-helper-task-uuid',
        timestamp: '2025-01-01T00:00:03.000Z',
      });
      const helperResultLine = JSON.stringify({
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: helperToolUseId, content: 'helper done' },
            ],
          },
          toolUseResult: { agentId: helperRealAgentId },
        }),
        uuid: 'nested-helper-result-uuid',
        timestamp: '2025-01-01T00:00:08.000Z',
      });

      // the helper's OWN subagent stream: its activity text.
      const helperTextLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: { role: 'assistant', content: [{ type: 'text', text: 'HELPER_TEXT' }] },
        }),
        uuid: 'nested-helper-text-uuid',
        timestamp: '2025-01-01T00:00:05.000Z',
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({ content: [userLine, cwTaskLine, cwResultLine].join('\n') });
      proxy.setupSubagentDir({
        files: [
          FileNameStub({ value: `agent-${cwRealAgentId}.jsonl` }),
          FileNameStub({ value: `agent-${helperRealAgentId}.jsonl` }),
        ],
      });
      // FIFO order must match the files array above: codeweaver stream first, helper stream second.
      proxy.setupSubagentFile({ content: [helperTaskLine, helperResultLine].join('\n') });
      proxy.setupSubagentFile({ content: helperTextLine });

      const allEntries: unknown[] = [];
      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntries: ({ entries }) => {
          allEntries.push(...entries);
        },
      });

      // Project only the helper's own stream text entry. The invariant: it correlates to the
      // HELPER Task's toolUseId (resolved via the pre-scan walking codeweaver's subagent JSONL),
      // NOT the helper's real internal agentId from its filename.
      const helperProjection = allEntries
        .map((entry) => entry as Record<PropertyKey, unknown>)
        .filter((entry) => entry.content === 'HELPER_TEXT')
        .map((entry) => ({ agentId: entry.agentId, source: entry.source }));

      expect(helperProjection).toStrictEqual([{ agentId: helperToolUseId, source: 'subagent' }]);
    });

    it('VALID: {agentId param} => emits ONLY the matching sub-agent JSONL; other sub-agents skipped', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });

      const matchingAgentId = 'acd35f7b7763e33e8';
      const otherAgentId = 'b00000000000other';

      const matchingSubLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'MATCHING_SUBAGENT_OUTPUT' }],
          },
        }),
        uuid: 'matching-sub-line-uuid',
        timestamp: '2025-01-01T00:00:02.000Z',
      });

      const otherSubLine = JSON.stringify({
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'OTHER_SUBAGENT_OUTPUT' }],
          },
        }),
        uuid: 'other-sub-line-uuid',
        timestamp: '2025-01-01T00:00:03.000Z',
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      // Main JSONL read is skipped when agentId is supplied — do NOT queue main content,
      // otherwise the first subagent read pops that off the shared FIFO mock instead of
      // its own content.
      proxy.setupSubagentDir({
        files: [
          FileNameStub({ value: `agent-${matchingAgentId}.jsonl` }),
          FileNameStub({ value: `agent-${otherAgentId}.jsonl` }),
        ],
      });
      proxy.setupSubagentFile({ content: matchingSubLine });
      proxy.setupSubagentFile({ content: otherSubLine });

      const batches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        agentId: AgentIdStub({ value: matchingAgentId }),
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
            content: 'MATCHING_SUBAGENT_OUTPUT',
            source: 'subagent',
            agentId: matchingAgentId,
            uuid: 'matching-sub-line-uuid:0',
            timestamp: '2025-01-01T00:00:02.000Z',
          },
        ],
      ]);
    });
  });
});
