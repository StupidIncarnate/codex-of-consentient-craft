import {
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
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

  it('VALID: {workItemIdForAgent returns non-null workItemId} => emit carries workItemId', async () => {
    const proxy = startSubagentTailLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
    });
    const chatProcessId = ProcessIdStub({ value: 'layer-proc-3' });
    const agentId = AgentIdStub({ value: 'layer-agent-3' });
    const parentSessionId = SessionIdStub({ value: 'layer-parent-sess-3' });
    const activeQuestId = QuestIdStub({ value: 'layer-quest-3' });
    const workItemId = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    const processor = chatLineProcessTransformer();
    const handles = new Map<
      ReturnType<typeof AgentIdStub>,
      { stop: () => void; initialDrain: Promise<void> }
    >();

    proxy.setupLines({
      lines: [
        '{"type":"assistant","uuid":"layer-line-3","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"wi entry"}]}}',
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
      workItemIdForAgent: () => workItemId,
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
            content: 'wi entry',
            source: 'subagent',
            agentId: 'layer-agent-3',
            uuid: 'layer-line-3:0',
            timestamp: '2026-05-13T10:00:00.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
        workItemId,
      },
    ]);
  });

  it('VALID: {sub-agent JSONL line produces agent-detected output} => nested tail registered in handles map and emits its lines', async () => {
    const proxy = startSubagentTailLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
    });
    const chatProcessId = ProcessIdStub({ value: 'layer-proc-4' });
    const agentId = AgentIdStub({ value: 'layer-agent-4' });
    const parentSessionId = SessionIdStub({ value: 'layer-parent-sess-4' });
    const activeQuestId = QuestIdStub({ value: 'layer-quest-4' });
    const processor = chatLineProcessTransformer();
    const handles = new Map<
      ReturnType<typeof AgentIdStub>,
      { stop: () => void; initialDrain: Promise<void> }
    >();

    // A tool_result line written to a sub-agent's JSONL that registers a nested agent.
    // The processor emits agent-detected when it sees tool_use_result.agentId alongside
    // the tool_use_id, and the broker recursively calls startSubagentTailLayerBroker for
    // the detected child.
    const NESTED_TOOLRESULT =
      '{"type":"user","uuid":"nested-result","timestamp":"2026-05-13T10:00:10.000Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_nested","content":"done"}]},"tool_use_result":{"agentId":"real-nested","status":"completed"}}';
    // A plain text line from the nested sub-agent's own tail, processed in Round 2
    // after the recursive tail starts.
    const NESTED_TEXT =
      '{"type":"assistant","uuid":"nested-text","timestamp":"2026-05-13T10:00:20.000Z","message":{"content":[{"type":"text","text":"nested output"}]}}';

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

    // Round 1: A-tail processes NESTED_TOOLRESULT — the onLine handler emits a tool_result
    // entry AND an agent-detected output that triggers the recursive call, registering the
    // nested tail. The nested tail's watch callback is registered inside the setImmediate
    // that drives readline, so it is NOT included in this triggerChange's synchronous
    // for-of loop over watchCallbacks. It becomes visible on the next triggerChange.
    proxy.setupLines({ lines: [NESTED_TOOLRESULT] });
    proxy.triggerChange();
    await flushImmediate();

    // Both the original tail (A) and the newly registered nested tail are in handles.
    expect(handles.size).toBe(2);

    // Round 2: both A-tail and nested-tail fire. A-tail gets empty; nested-tail gets
    // NESTED_TEXT. Batches are FIFO across all watchers in registration order (A first,
    // nested second).
    proxy.setupLines({ lines: [] }); // A-tail: nothing new
    proxy.setupLines({ lines: [NESTED_TEXT] }); // nested tail: text line
    proxy.triggerChange();
    await flushImmediate();

    expect(emitted).toStrictEqual([
      // Round 1: tool_result from A-tail. agentId is 'layer-agent-4' because
      // 'layer-agent-4' has no reverse-map entry — the raw agentId is stamped directly
      // (processor line 190: original.agentId = agentId when isSubagentByParent is false).
      {
        chatProcessId,
        entries: [
          {
            role: 'assistant',
            type: 'tool_result',
            toolName: 'toolu_nested',
            content: 'done',
            source: 'subagent',
            agentId: 'layer-agent-4',
            uuid: 'nested-result:0',
            timestamp: '2026-05-13T10:00:10.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
      // Round 2: text from the nested tail. 'real-nested' resolves via the processor's
      // reverse map to 'toolu_nested'. parentAgentId is absent: at the point in the
      // processor where parentChainMap would be written (line 176), original.agentId was
      // still undefined (it gets stamped at line 190, after the parentChainMap write),
      // so no parent-chain link was recorded for 'toolu_nested'.
      {
        chatProcessId,
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'nested output',
            source: 'subagent',
            agentId: 'toolu_nested',
            uuid: 'nested-text:0',
            timestamp: '2026-05-13T10:00:20.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
    ]);
  });
});
