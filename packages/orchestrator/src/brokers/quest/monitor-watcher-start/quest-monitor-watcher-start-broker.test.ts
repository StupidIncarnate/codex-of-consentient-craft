import {
  FileNameStub,
  QuestIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { questMonitorWatcherStartBroker } from './quest-monitor-watcher-start-broker';
import { questMonitorWatcherStartBrokerProxy } from './quest-monitor-watcher-start-broker.proxy';

type EmitParam = Parameters<Parameters<typeof questMonitorWatcherStartBroker>[0]['emit']>[0];

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('questMonitorWatcherStartBroker', () => {
  describe('start + stop lifecycle', () => {
    it('VALID: {parentSessionId, projectDir} => returns a handle whose stop is idempotent', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId: '38c6cbd2-8bf1-6507-8d07-0980dd1fb595',
        projectDir: '/home/user/my-project',
        emit: (): void => {
          // no-op — emit recording covered by per-output assertions below
        },
      });

      // stop() must be idempotent — the quest-driven reactor calls it during reconcile
      // and again on shutdown, so a second invocation must not throw.
      let threw = false;
      try {
        handle.stop();
        handle.stop();
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
    });
  });

  // A tail is a delivery identity, and chat-output naming a chatProcessId is what arms the web
  // composer's running indicator. Only a chat-complete naming that SAME id disarms it, so a tail
  // that emitted output and then vanished silently leaves the composer on STOP forever.
  describe('stop-time terminal event', () => {
    it('VALID: {worker session, stop()} => emits one chat-complete naming the tail chatProcessId, its session, its work item and its quest', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '88888888-8888-8888-8888-888888888888';
      const workerWorkItemId = String(WorkItemStub().id);
      const workerQuestId = String(QuestIdStub({ value: 'a1e884c2-5f67-6af6-97dd-5819484fba4d' }));

      const emitted: EmitParam[] = [];

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
        workerWorkItemId,
        workerQuestId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      handle.stop();

      expect(emitted).toStrictEqual([
        {
          type: 'chat-complete',
          processId: `proc-worker-${parentSessionId}`,
          payload: {
            chatProcessId: `proc-worker-${parentSessionId}`,
            sessionId: SessionIdStub({ value: parentSessionId }),
            questId: QuestIdStub({ value: workerQuestId }),
            workItemId: WorkItemStub().id,
          },
        },
      ]);
    });

    it('VALID: {worker session, stop() twice} => emits the terminal exactly once', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = 'a979fd6f-6969-1e05-b65b-fd78e7c13ea6';
      const emitted: EmitParam[] = [];

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
        workerWorkItemId: String(WorkItemStub().id),
        workerQuestId: String(QuestIdStub({ value: 'd1d3dc17-dd42-495e-af8a-8e1e84e470db' })),
        emit: (call) => {
          emitted.push(call);
        },
      });

      handle.stop();
      handle.stop();

      expect(emitted.map((call) => call.type)).toStrictEqual(['chat-complete']);
    });

    // A /dumpster-launch dispatcher session tails sub-agents belonging to several quests at once,
    // so there is no single questId a per-quest terminal could honestly name.
    it('EMPTY: {dispatcher session (no workerWorkItemId/workerQuestId), stop()} => emits nothing', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const emitted: EmitParam[] = [];

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId: 'c52bdfd3-3aeb-2325-887f-4dc02d562097',
        projectDir: '/home/user/p',
        emit: (call) => {
          emitted.push(call);
        },
      });

      handle.stop();

      expect(emitted).toStrictEqual([]);
    });
  });

  describe('chat-output emit payload', () => {
    it('VALID: {sub-agent JSONL emits entries} => chat-output payload stamps sessionId=parentSessionId so the web binding bucket matches wi.sessionId', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '35fd5b8f-551b-8baf-b8fb-a5c4702e7b71';
      const realAgentId = 'b9d4a2c8f7e6';

      proxy.setupSubagentDirFiles({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })],
      });
      proxy.setupActiveQuest({
        questId: QuestIdStub({ value: 'a99ef0d8-6ae0-1972-9617-694d449a8242' }),
        agentIds: [AgentIdStub({ value: realAgentId })],
      });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"sub-agent-line","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"streamed sub-agent text"}]}}',
        ],
      });
      proxy.setupLines({ lines: [] });

      const emitted: EmitParam[] = [];

      await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
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
            // The watcher resolves the sub-agent's owning work item from the active quest's
            // agentId→workItemId map and stamps it so the web routes the transcript to this
            // row. setupActiveQuest builds the work item via WorkItemStub (default id).
            workItemId: WorkItemStub().id,
          },
        },
      ]);
    });

    it('VALID: {main JSONL emits entries} => chat-output payload omits sessionId (main tail is dispatcher chatter, not per-row content)', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '97241aaa-ae56-6f58-b9ec-a952ee85b407';

      proxy.setupSubagentDirFiles({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        files: [],
      });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"main-line","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"main tail emit"}]}}',
        ],
      });

      const emitted: EmitParam[] = [];

      await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
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

    it('VALID: {node-dispatch worker session (workerWorkItemId set), main JSONL emits entries} => chat-output uses proc-worker- prefix and stamps sessionId + workItemId so the row renders live', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '9f7abf0d-ce8a-518c-9781-61bfa3057384';
      const workerWorkItemId = String(WorkItemStub().id);

      proxy.setupSubagentDirFiles({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        files: [],
      });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"worker-line","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"pathseeker work"}]}}',
        ],
      });

      const emitted: EmitParam[] = [];

      await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
        workerWorkItemId,
        emit: (call) => {
          emitted.push(call);
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(emitted).toStrictEqual([
        {
          type: 'chat-output',
          processId: `proc-worker-${parentSessionId}`,
          payload: {
            chatProcessId: `proc-worker-${parentSessionId}`,
            entries: [
              {
                role: 'assistant',
                type: 'text',
                content: 'pathseeker work',
                source: 'session',
                uuid: 'worker-line:0',
                timestamp: '2026-05-13T10:00:00.000Z',
              },
            ],
            sessionId: SessionIdStub({ value: parentSessionId }),
            workItemId: WorkItemStub().id,
          },
        },
      ]);
    });
  });
});
