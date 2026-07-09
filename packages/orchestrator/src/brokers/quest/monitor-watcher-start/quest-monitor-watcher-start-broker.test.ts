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
        parentSessionId: '11111111-1111-1111-1111-111111111111',
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

  describe('chat-output emit payload', () => {
    it('VALID: {sub-agent JSONL emits entries} => chat-output payload stamps sessionId=parentSessionId so the web binding bucket matches wi.sessionId', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '55555555-5555-5555-5555-555555555555';
      const realAgentId = 'b9d4a2c8f7e6';

      proxy.setupSubagentDirFiles({
        files: [FileNameStub({ value: `agent-${realAgentId}.jsonl` })],
      });
      proxy.setupActiveQuest({
        questId: QuestIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }),
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

      const parentSessionId = '66666666-6666-6666-6666-666666666666';

      proxy.setupSubagentDirFiles({ files: [] });
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

      const parentSessionId = '77777777-7777-7777-7777-777777777777';
      const workerWorkItemId = String(WorkItemStub().id);

      proxy.setupSubagentDirFiles({ files: [] });
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
