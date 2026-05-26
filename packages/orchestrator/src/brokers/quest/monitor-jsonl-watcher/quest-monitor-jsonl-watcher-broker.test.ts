import {
  FileNameStub,
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';

import { questMonitorJsonlWatcherBroker } from './quest-monitor-jsonl-watcher-broker';
import { questMonitorJsonlWatcherBrokerProxy } from './quest-monitor-jsonl-watcher-broker.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('questMonitorJsonlWatcherBroker', () => {
  describe('main JSONL tail', () => {
    it('VALID: {assistant text line on main JSONL, active quest set} => emits tagged ChatEntry with active questId', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-1' });
      const activeQuestId = QuestIdStub({ value: 'add-auth' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-1","timestamp":"2026-05-13T10:00:01.000Z","message":{"content":[{"type":"text","text":"hello from main"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        monitorSession: { projectDir, sessionFilePath, registeredAt },
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'hello from main',
              source: 'session',
              uuid: 'line-1:0',
              timestamp: '2026-05-13T10:00:01.000Z',
            },
          ],
          questId: activeQuestId,
        },
      ]);
    });

    it('VALID: {activeQuestIdGetter returns null} => emits ChatEntry with questId: null', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-2' });

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-2","timestamp":"2026-05-13T10:00:02.000Z","message":{"content":[{"type":"text","text":"idle chatter"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        monitorSession: { projectDir, sessionFilePath, registeredAt },
        activeQuestIdGetter: () => null,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'idle chatter',
              source: 'session',
              uuid: 'line-2:0',
              timestamp: '2026-05-13T10:00:02.000Z',
            },
          ],
          questId: null,
        },
      ]);
    });

    it('VALID: {two emissions with different active quest between them} => each batch tagged with the questId at its emit time', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-flip' });
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });

      let activeQuest: QuestId | null = questA;

      proxy.setupSubagentDirEmpty();
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-flip-1","timestamp":"2026-05-13T10:00:03.000Z","message":{"content":[{"type":"text","text":"during A"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        monitorSession: { projectDir, sessionFilePath, registeredAt },
        activeQuestIdGetter: () => activeQuest,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      // Flip the active quest BEFORE the next batch of lines lands.
      activeQuest = questB;

      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-flip-2","timestamp":"2026-05-13T10:00:04.000Z","message":{"content":[{"type":"text","text":"during B"}]}}',
        ],
      });
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'during A',
              source: 'session',
              uuid: 'line-flip-1:0',
              timestamp: '2026-05-13T10:00:03.000Z',
            },
          ],
          questId: questA,
        },
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'during B',
              source: 'session',
              uuid: 'line-flip-2:0',
              timestamp: '2026-05-13T10:00:04.000Z',
            },
          ],
          questId: questB,
        },
      ]);
    });

    it('EMPTY: {subagents directory missing (ENOENT)} => watcher still starts, main JSONL emissions work', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/no-subdir-session.jsonl',
      });
      const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-no-subdir' });
      const activeQuestId = QuestIdStub({ value: 'no-subdir-quest' });

      proxy.setupSubagentDirMissing({ error: new Error('ENOENT: no such directory') });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"line-3","timestamp":"2026-05-13T10:00:05.000Z","message":{"content":[{"type":"text","text":"only main"}]}}',
        ],
      });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        monitorSession: { projectDir, sessionFilePath, registeredAt },
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'only main',
              source: 'session',
              uuid: 'line-3:0',
              timestamp: '2026-05-13T10:00:05.000Z',
            },
          ],
          questId: activeQuestId,
        },
      ]);
    });
  });

  describe('subagent JSONL tails', () => {
    it('VALID: {pre-existing agent-<id>.jsonl in subagents/} => sub-agent tail starts and emits its lines tagged with active questId', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-sub' });
      const activeQuestId = QuestIdStub({ value: 'quest-with-sub' });

      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: 'agent-real-1.jsonl' })],
      });
      // Watchers are created in this order: (1) the sub-agent tail during initial scan,
      // (2) the main tail. Both share one fsWatchTailAdapter mock — the queue is FIFO,
      // and a single `triggerChange()` fires each watcher's callback once in registration
      // order. So batch[0] feeds the sub-agent's createReadStream, batch[1] feeds the main.
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"sub-line-1","timestamp":"2026-05-13T10:00:06.000Z","message":{"content":[{"type":"text","text":"from sub"}]}}',
        ],
      });
      proxy.setupLines({ lines: [] });

      const emitted: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        monitorSession: { projectDir, sessionFilePath, registeredAt },
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          chatProcessId,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'from sub',
              source: 'subagent',
              agentId: 'real-1',
              uuid: 'sub-line-1:0',
              timestamp: '2026-05-13T10:00:06.000Z',
            },
          ],
          questId: activeQuestId,
          // Parent session UUID derived from `monitorSession.sessionFilePath`'s basename
          // (abc-123.jsonl → abc-123). Stamped on every sub-agent emit so the web binding
          // buckets streaming frames under the same key chat-replay-responder uses and
          // get-agent-prompt's modify-quest stamps onto `wi.sessionId`.
          sessionId: SessionIdStub({ value: 'abc-123' }),
        },
      ]);
    });
  });

  describe('onSessionIdLearned forwarding', () => {
    it('VALID: {pre-existing subagent JSONL + first user-text line embeds taskPrompt} => callback fires with {questId, workItemId, sessionId=agentId}', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-forward' });
      const activeQuestId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
      const realAgentId = 'acd35f7b7763e33e8';

      const promptText = `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "pathseeker-surface",\n  workItemId: "${String(
        workItemId,
      )}",\n  questId: "${String(activeQuestId)}"\n}) and follow its instructions exactly.`;
      const promptJson = JSON.stringify(promptText);

      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })],
      });
      proxy.setupLines({
        lines: [
          `{"type":"user","uuid":"sub-first","timestamp":"2026-05-13T10:00:00.000Z","message":{"role":"user","content":${promptJson}}}`,
        ],
      });
      proxy.setupLines({ lines: [] });

      const learned: unknown[] = [];

      questMonitorJsonlWatcherBroker({
        monitorSession: { projectDir, sessionFilePath, registeredAt },
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (): void => {
          // entries emit ignored in this scope
        },
        onSessionIdLearned: (call) => {
          learned.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(learned).toStrictEqual([
        {
          questId: activeQuestId,
          workItemId,
          sessionId: SessionIdStub({ value: realAgentId }),
        },
      ]);
    });
  });

  describe('stop()', () => {
    it('VALID: {stop called} => subsequent change events emit nothing', async () => {
      const proxy = questMonitorJsonlWatcherBrokerProxy();
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const registeredAt = IsoTimestampStub({ value: '2026-05-13T10:00:00.000Z' });
      const chatProcessId = ProcessIdStub({ value: 'monitor-proc-stop' });
      const activeQuestId = QuestIdStub({ value: 'stop-quest' });

      proxy.setupSubagentDirEmpty();

      const emitted: unknown[] = [];

      const handle = questMonitorJsonlWatcherBroker({
        monitorSession: { projectDir, sessionFilePath, registeredAt },
        activeQuestIdGetter: () => activeQuestId,
        chatProcessId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      handle.stop();

      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"after-stop","timestamp":"2026-05-13T10:00:07.000Z","message":{"content":[{"type":"text","text":"too late"}]}}',
        ],
      });
      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([]);
    });
  });
});
