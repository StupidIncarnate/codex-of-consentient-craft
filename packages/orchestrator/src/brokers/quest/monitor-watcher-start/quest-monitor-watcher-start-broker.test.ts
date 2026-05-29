import { FileNameStub, QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

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
  });
});
