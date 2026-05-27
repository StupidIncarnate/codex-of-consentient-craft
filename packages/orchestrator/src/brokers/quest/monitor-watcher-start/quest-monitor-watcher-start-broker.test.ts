import {
  FileNameStub,
  FilePathStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import type { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';
import { questMonitorWatcherStartBroker } from './quest-monitor-watcher-start-broker';
import { questMonitorWatcherStartBrokerProxy } from './quest-monitor-watcher-start-broker.proxy';

type EmitParam = Parameters<Parameters<typeof questMonitorWatcherStartBroker>[0]['emit']>[0];

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

type IsoTimestamp = ReturnType<typeof IsoTimestampStub>;
type FilePath = ReturnType<typeof FilePathStub>;
type CallEvent = 'clear' | 'register';

const makeMonitorSession = (): {
  isRegistered: () => boolean;
  clear: () => void;
  register: (params: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  }) => void;
  get: () => {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  } | null;
  callOrder: () => readonly CallEvent[];
} => {
  let registered: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  } | null = null;
  const order: CallEvent[] = [];

  return {
    isRegistered: (): boolean => registered !== null,
    clear: (): void => {
      registered = null;
      order.push('clear');
    },
    register: ({
      projectDir,
      sessionFilePath,
      registeredAt,
    }: {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    }): void => {
      registered = { projectDir, sessionFilePath, registeredAt };
      order.push('register');
    },
    get: (): {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    } | null => registered,
    callOrder: (): readonly CallEvent[] => order,
  };
};

describe('questMonitorWatcherStartBroker', () => {
  describe('start + stop lifecycle', () => {
    it('VALID: {parentSessionId, projectDir} => registers monitor session and returns handle', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      const monitorSession = makeMonitorSession();

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId: '11111111-1111-1111-1111-111111111111',
        projectDir: '/home/user/my-project',
        monitorSession,
        emit: (): void => {
          // no-op — emit recording covered by JSONL watcher tests
        },
      });

      const registered = monitorSession.get();

      expect(registered?.projectDir).toBe(FilePathStub({ value: '/home/user/my-project' }));
      expect(registered?.sessionFilePath).toBe(
        FilePathStub({
          value:
            '/home/user/.claude/projects/-home-user-my-project/11111111-1111-1111-1111-111111111111.jsonl',
        }),
      );

      handle.stop();

      expect(monitorSession.isRegistered()).toBe(false);
    });

    it('VALID: {stop()} => clears monitor session', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      const monitorSession = makeMonitorSession();

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId: '22222222-2222-2222-2222-222222222222',
        projectDir: '/home/user/p',
        monitorSession,
        emit: (): void => {
          // no-op for this test
        },
      });

      expect(monitorSession.isRegistered()).toBe(true);

      handle.stop();

      expect(monitorSession.isRegistered()).toBe(false);
    });

    it('VALID: {register sequence} => clear happens before register', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      const monitorSession = makeMonitorSession();

      await questMonitorWatcherStartBroker({
        parentSessionId: '33333333-3333-3333-3333-333333333333',
        projectDir: '/home/user/p',
        monitorSession,
        emit: (): void => {
          // no-op
        },
      });

      expect(monitorSession.callOrder()).toStrictEqual(['clear', 'register']);
    });
  });

  describe('chat-output emit payload', () => {
    it('VALID: {sub-agent JSONL emits entries} => chat-output payload stamps sessionId=parentSessionId so the web binding bucket matches wi.sessionId', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '55555555-5555-5555-5555-555555555555';
      const realAgentId = 'b9d4a2c8f7e6';

      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })],
      });
      // The quest-driven watcher only tails subagent JSONLs whose agentId matches an
      // in-progress work item in quest.json. Seed an active quest carrying the
      // realAgentId so the predicate admits this file.
      proxy.setupActiveQuest({
        questId: QuestIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }),
        agentIds: [AgentIdStub({ value: realAgentId })],
      });
      // Sub-agent tail reads first (FIFO across watchers — sub-agent tails register before
      // the main tail). Queue an assistant-text line for the sub-agent and an empty batch
      // for the main tail so the trigger fires both watchers' callbacks cleanly.
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"sub-agent-line","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"streamed sub-agent text"}]}}',
        ],
      });
      proxy.setupLines({ lines: [] });

      const monitorSession = makeMonitorSession();
      const emitted: EmitParam[] = [];

      await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
        monitorSession,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          type: 'chat-output',
          processId: `proc-monitor-${parentSessionId}`,
          payload: {
            chatProcessId: `proc-monitor-${parentSessionId}`,
            entries: [
              {
                role: 'assistant',
                type: 'text',
                content: 'streamed sub-agent text',
                source: 'subagent',
                agentId: realAgentId,
                uuid: 'sub-agent-line:0',
                timestamp: '2026-05-13T10:00:00.000Z',
              },
            ],
            sessionId: SessionIdStub({ value: parentSessionId }),
          },
        },
      ]);
    });

    it('VALID: {main JSONL emits entries} => chat-output payload omits sessionId (main tail is dispatcher chatter, not per-row content)', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '66666666-6666-6666-6666-666666666666';

      // No sub-agent files — only the main JSONL tail runs.
      proxy.setupSubagentDirFiles({ files: [] });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"main-line","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"main tail emit"}]}}',
        ],
      });

      const monitorSession = makeMonitorSession();
      const emitted: EmitParam[] = [];

      await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
        monitorSession,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      // Main-session frames don't bucket per work-item row, so the payload must NOT
      // carry `sessionId` — including it would route every dispatcher line into one
      // of the execution rows whose wi.sessionId equals the parent session id.
      expect(emitted).toStrictEqual([
        {
          type: 'chat-output',
          processId: `proc-monitor-${parentSessionId}`,
          payload: {
            chatProcessId: `proc-monitor-${parentSessionId}`,
            entries: [
              {
                role: 'assistant',
                type: 'text',
                content: 'main tail emit',
                source: 'session',
                uuid: 'main-line:0',
                timestamp: '2026-05-13T10:00:00.000Z',
              },
            ],
          },
        },
      ]);
    });
  });
});
