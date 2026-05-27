import {
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { startSubagentTailLayerBroker } from './start-subagent-tail-layer-broker';
import { startSubagentTailLayerBrokerProxy } from './start-subagent-tail-layer-broker.proxy';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('startSubagentTailLayerBroker', () => {
  it('VALID: {subagent JSONL line emitted} => emit fires with chatProcessId, entries (source=subagent), active questId, and sessionId=parentSessionId', async () => {
    const proxy = startSubagentTailLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
    });
    const chatProcessId = ProcessIdStub({ value: 'layer-proc-1' });
    const agentId = AgentIdStub({ value: 'layer-agent-1' });
    const parentSessionId = SessionIdStub({ value: 'layer-parent-sess' });
    const activeQuestId = QuestIdStub({ value: 'layer-quest-1' });
    const processor = chatLineProcessTransformer();
    const handles = new Map<
      ReturnType<typeof AgentIdStub>,
      { stop: () => void; initialDrain: Promise<void> }
    >();

    proxy.setupLines({
      lines: [
        '{"type":"assistant","uuid":"layer-line-1","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"layer entry"}]}}',
      ],
    });

    const emitted: unknown[] = [];

    startSubagentTailLayerBroker({
      agentId,
      sessionFilePath,
      parentSessionId,
      processor,
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      subagentHandles: handles,
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
            content: 'layer entry',
            source: 'subagent',
            agentId: 'layer-agent-1',
            uuid: 'layer-line-1:0',
            timestamp: '2026-05-13T10:00:00.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
    ]);
  });

  it('VALID: {agentId already in handles map} => no second tail registered, no emit', async () => {
    const proxy = startSubagentTailLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
    });
    const chatProcessId = ProcessIdStub({ value: 'layer-proc-2' });
    const agentId = AgentIdStub({ value: 'layer-agent-2' });
    const parentSessionId = SessionIdStub({ value: 'layer-parent-sess-2' });
    const activeQuestId = QuestIdStub({ value: 'layer-quest-2' });
    const processor = chatLineProcessTransformer();
    const handles = new Map<
      ReturnType<typeof AgentIdStub>,
      { stop: () => void; initialDrain: Promise<void> }
    >();
    handles.set(agentId, { stop: (): void => {}, initialDrain: Promise.resolve() });

    proxy.setupLines({
      lines: [
        '{"type":"assistant","uuid":"layer-noop","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"should not fire"}]}}',
      ],
    });

    const emitted: unknown[] = [];

    startSubagentTailLayerBroker({
      agentId,
      sessionFilePath,
      parentSessionId,
      processor,
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      subagentHandles: handles,
    });

    proxy.triggerChange();
    await flushImmediate();

    expect(emitted).toStrictEqual([]);
  });
});
