import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import { ProcessIdStub, RepoRootCwdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { ChatLineAgentDetectedStub } from '../../../contracts/chat-line-output/chat-line-output.stub';
import { ChatLineProcessorStub } from '../../../contracts/chat-line-processor/chat-line-processor.stub';
import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { chatMainSessionTailBroker } from './chat-main-session-tail-broker';
import { chatMainSessionTailBrokerProxy } from './chat-main-session-tail-broker.proxy';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('chatMainSessionTailBroker', () => {
  describe('tailing main session lines', () => {
    it('VALID: {task-notification line appended post-exit} => dispatches parsed task_notification entry via onEntries', async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-main-tail' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-1' });
      const processor = chatLineProcessTransformer();

      proxy.setupHomeDir({ homeDir: '/home/user' });
      proxy.setupLines({
        lines: [
          JSON.stringify({
            type: 'user',
            uuid: 'main-session-tail-line-uuid',
            timestamp: '2025-01-01T00:00:00.000Z',
            message: {
              role: 'user',
              content:
                '<task-notification><task-id>task-bg-1</task-id><status>completed</status><summary>Background agent done</summary><result>All good</result></task-notification>',
            },
          }),
        ],
      });

      const batches: unknown[] = [];

      chatMainSessionTailBroker({
        sessionId,
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([
        {
          chatProcessId: 'proc-main-1',
          entries: [
            {
              role: 'system',
              type: 'task_notification',
              taskId: 'task-bg-1',
              status: 'completed',
              summary: 'Background agent done',
              result: 'All good',
              source: 'session',
              uuid: 'main-session-tail-line-uuid:task-notification',
              timestamp: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      ]);
    });

    it("VALID: {main-session line tailed} => calls processor.processLine with parsed line and source='session' (no agentId)", async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-main-args' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-args' });
      const calls: Parameters<ReturnType<typeof ChatLineProcessorStub>['processLine']>[0][] = [];
      const processor = ChatLineProcessorStub({
        processLine: (params) => {
          calls.push(params);
          return [];
        },
      });

      const rawLine =
        '{"type":"assistant","message":{"content":[{"type":"text","text":"main session line"}]}}';
      const expectedParsed = claudeLineNormalizeBroker({ rawLine });

      proxy.setupHomeDir({ homeDir: '/home/user' });
      proxy.setupLines({ lines: [rawLine] });

      chatMainSessionTailBroker({
        sessionId,
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor,
        chatProcessId,
        onEntries: () => {},
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(calls).toStrictEqual([
        {
          parsed: expectedParsed,
          source: 'session',
        },
      ]);
    });

    it("VALID: {existing file content} => fsWatchTailAdapter invoked with startPosition: 'end' so existing content is NOT re-emitted", async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-main-startpos' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-startpos' });
      const processor = chatLineProcessTransformer();

      proxy.setupHomeDir({ homeDir: '/home/user' });
      proxy.setupExistingFileWithContent();
      proxy.setupLines({
        lines: [
          '{"type":"assistant","message":{"content":[{"type":"text","text":"late append"}]}}',
        ],
      });

      chatMainSessionTailBroker({
        sessionId,
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor,
        chatProcessId,
        onEntries: () => {},
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(proxy.lastStartPositionWasFromFileEnd()).toBe(true);
    });

    it('EMPTY: {non user/assistant line} => dispatches nothing', async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-main-noise' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-noise' });
      const processor = chatLineProcessTransformer();

      proxy.setupHomeDir({ homeDir: '/home/user' });
      proxy.setupLines({
        lines: ['{"type":"system","subtype":"init"}'],
      });

      const batches: unknown[] = [];

      chatMainSessionTailBroker({
        sessionId,
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
    });

    it("EDGE: {processor returns type:'agent-detected'} => silently ignored, onEntries never fires", async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-main-agent-detected' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-agent-detected' });
      const processor = ChatLineProcessorStub({
        processLine: () => [
          ChatLineAgentDetectedStub({
            toolUseId: ToolUseIdStub({ value: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ' }) as never,
            agentId: AgentIdStub({ value: 'agent-real-internal' }) as never,
          }),
        ],
      });

      proxy.setupHomeDir({ homeDir: '/home/user' });
      proxy.setupLines({
        lines: ['{"type":"assistant","message":{"content":[{"type":"text","text":"anything"}]}}'],
      });

      const batches: unknown[] = [];

      chatMainSessionTailBroker({
        sessionId,
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
    });

    it('VALID: {stop handle} => returns a function that stops further emissions', async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-main-stop' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-stop' });
      const processor = chatLineProcessTransformer();

      proxy.setupHomeDir({ homeDir: '/home/user' });

      const batches: unknown[] = [];

      const stop = chatMainSessionTailBroker({
        sessionId,
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
      });

      stop();

      proxy.setupLines({ lines: ['{"type":"user","message":{"role":"user","content":"late"}}'] });
      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
    });
  });

  describe('which project directory the transcript is read from', () => {
    it('VALID: {cwd: repo root} => tails the JSONL encoded from that cwd', async () => {
      const proxy = chatMainSessionTailBrokerProxy();

      proxy.setupHomeDir({ homeDir: '/home/user' });

      chatMainSessionTailBroker({
        sessionId: SessionIdStub({ value: 'session-at-repo-root' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor: chatLineProcessTransformer(),
        chatProcessId: ProcessIdStub({ value: 'proc-main-repo-root' }),
        onEntries: () => {},
      });

      await flushImmediate();

      expect(proxy.lastWatchedPath()).toBe(
        '/home/user/.claude/projects/-home-user-my-project/session-at-repo-root.jsonl',
      );
    });

    it("VALID: {cwd: a worktree under the guild path} => tails the WORKTREE's encoding, not the guild's", async () => {
      const proxy = chatMainSessionTailBrokerProxy();

      proxy.setupHomeDir({ homeDir: '/home/user' });

      chatMainSessionTailBroker({
        sessionId: SessionIdStub({ value: 'session-in-worktree' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project/worktrees/quest-c8171a64' }),
        processor: chatLineProcessTransformer(),
        chatProcessId: ProcessIdStub({ value: 'proc-main-worktree' }),
        onEntries: () => {},
      });

      await flushImmediate();

      expect(proxy.lastWatchedPath()).toBe(
        '/home/user/.claude/projects/-home-user-my-project-worktrees-quest-c8171a64/session-in-worktree.jsonl',
      );
    });
  });
});
