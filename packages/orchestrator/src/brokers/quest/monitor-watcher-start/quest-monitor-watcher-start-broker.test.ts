import {
  FileNameStub,
  QuestIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questMonitorWatcherStartBroker } from './quest-monitor-watcher-start-broker';
import { questMonitorWatcherStartBrokerProxy } from './quest-monitor-watcher-start-broker.proxy';

type EmitParam = Parameters<Parameters<typeof questMonitorWatcherStartBroker>[0]['emit']>[0];

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('questMonitorWatcherStartBroker', () => {
  describe('start + stop lifecycle', () => {
    it('VALID: {parentSessionId, projectDir, workerWorkItemId, workerQuestId} => returns a handle whose stop is idempotent', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupSessionFile({
        homeDir: '/home/user',
        projectDir: '/home/user/my-project',
        parentSessionId: '38c6cbd2-8bf1-6507-8d07-0980dd1fb595',
      });

      const handle = await questMonitorWatcherStartBroker({
        parentSessionId: '38c6cbd2-8bf1-6507-8d07-0980dd1fb595',
        projectDir: '/home/user/my-project',
        workerWorkItemId: String(WorkItemStub().id),
        workerQuestId: String(QuestIdStub({ value: 'ffffffff-0000-1111-2222-333333333333' })),
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
      proxy.setupSessionFile({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
      });

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
      proxy.setupSessionFile({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
      });
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
  });

  describe('chat-output emit payload', () => {
    it('VALID: {sub-agent JSONL pairs against the worker session own outstanding Task} => chat-output payload stamps sessionId=parentSessionId and the worker workItemId so the web binding bucket matches wi.sessionId', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '55555555-5555-5555-5555-555555555555';
      const workerWorkItemId = String(WorkItemStub().id);
      const workerQuestId = String(QuestIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }));

      proxy.setupSubagentDirFiles({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        files: [FileNameStub({ value: 'agent-b9d4a2c8f7e6.jsonl' })],
      });
      proxy.setupFirstLineRead({
        content:
          '{"type":"user","uuid":"worker-sub-prompt","timestamp":"2026-05-13T09:59:59.500Z","message":{"role":"user","content":"worker slice prompt"}}',
      });
      // Main tail's first drain: the Task tool_use line the worker's own session emits when
      // it spawns this sub-agent — this is what the poll tick's pairing attempt needs.
      proxy.setupLines({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        lines: [
          '{"type":"assistant","uuid":"worker-task","timestamp":"2026-05-13T09:59:59.000Z","message":{"content":[{"type":"tool_use","id":"toolu_worker_sub","name":"Agent","input":{"prompt":"worker slice prompt"}}]}}',
        ],
      });

      // The sub-agent tail starts once the poll tick pairs its file, and drains this batch as it does.
      proxy.setupSubagentLines({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        fileName: FileNameStub({ value: 'agent-b9d4a2c8f7e6.jsonl' }),
        lines: [
          '{"type":"assistant","uuid":"sub-agent-line","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"streamed sub-agent text"}]}}',
        ],
      });

      const emitted: EmitParam[] = [];

      await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
        workerWorkItemId,
        workerQuestId,
        emit: (call) => {
          emitted.push(call);
        },
      });
      await flushImmediate();

      // The main tail's first drain has delivered the Task line — the initial scan (run before
      // it) found the file but could not pair it yet, since the processor had no outstanding
      // Task at that point.
      proxy.triggerPollTick();
      await flushImmediate();
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
                type: 'tool_use',
                toolName: 'Agent',
                toolInput: '{"prompt":"worker slice prompt"}',
                toolUseId: 'toolu_worker_sub',
                source: 'session',
                agentId: 'toolu_worker_sub',
                uuid: 'worker-task:0',
                timestamp: '2026-05-13T09:59:59.000Z',
              },
            ],
            sessionId: SessionIdStub({ value: parentSessionId }),
            workItemId: WorkItemStub().id,
          },
        },
        {
          type: 'chat-output',
          processId: `proc-worker-${parentSessionId}`,
          payload: {
            chatProcessId: `proc-worker-${parentSessionId}`,
            entries: [
              {
                role: 'assistant',
                type: 'text',
                content: 'streamed sub-agent text',
                source: 'subagent',
                agentId: 'toolu_worker_sub',
                uuid: 'sub-agent-line:0',
                timestamp: '2026-05-13T10:00:00.000Z',
              },
            ],
            sessionId: SessionIdStub({ value: parentSessionId }),
            // A sub-agent carries no work item of its own — it falls back to the tailed
            // session's own worker work item, since every sub-agent this watcher tails
            // belongs to the run that spawned it.
            workItemId: WorkItemStub().id,
          },
        },
      ]);
    });

    it('VALID: {worker session, main JSONL emits entries} => chat-output uses the proc-worker- prefix and stamps sessionId + workItemId so the row renders live', async () => {
      const proxy = questMonitorWatcherStartBrokerProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const parentSessionId = '9f7abf0d-ce8a-518c-9781-61bfa3057384';
      const workerWorkItemId = String(WorkItemStub().id);
      const workerQuestId = String(QuestIdStub({ value: 'ffffffff-6666-7777-8888-999999999999' }));

      proxy.setupSubagentDirFiles({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        files: [],
      });
      proxy.setupLines({
        homeDir: '/home/user',
        projectDir: '/home/user/p',
        parentSessionId,
        lines: [
          '{"type":"assistant","uuid":"worker-line","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"pathseeker work"}]}}',
        ],
      });

      const emitted: EmitParam[] = [];

      await questMonitorWatcherStartBroker({
        parentSessionId,
        projectDir: '/home/user/p',
        workerWorkItemId,
        workerQuestId,
        emit: (call) => {
          emitted.push(call);
        },
      });

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
