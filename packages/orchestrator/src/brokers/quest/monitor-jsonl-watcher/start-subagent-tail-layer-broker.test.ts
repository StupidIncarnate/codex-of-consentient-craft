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

type QuestId = ReturnType<typeof QuestIdStub>;
type QuestWorkItemId = ReturnType<typeof QuestWorkItemIdStub>;
type SessionId = ReturnType<typeof SessionIdStub>;

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('startSubagentTailLayerBroker', () => {
  it('VALID: {subagent JSONL line emitted} => emit fires with chatProcessId, entries (source=subagent), and active questId', async () => {
    const proxy = startSubagentTailLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
    });
    const chatProcessId = ProcessIdStub({ value: 'layer-proc-1' });
    const agentId = AgentIdStub({ value: 'layer-agent-1' });
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
      },
    ]);
  });

  describe('onSessionIdLearned', () => {
    const taskPrompt = ({
      workItemId,
      questId,
    }: {
      workItemId: QuestWorkItemId;
      questId: QuestId;
    }) =>
      `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "pathseeker-surface",\n  workItemId: "${String(workItemId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly.`;

    it('VALID: {first user-text line carries workItemId/questId} => callback fires once with {questId, workItemId, sessionId=agentId}', async () => {
      const proxy = startSubagentTailLayerBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'sid-proc-1' });
      const agentId = AgentIdStub({ value: 'acd35f7b7763e33e8' });
      const activeQuestId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
      const processor = chatLineProcessTransformer();
      const handles = new Map<
        ReturnType<typeof AgentIdStub>,
        { stop: () => void; initialDrain: Promise<void> }
      >();

      const promptText = taskPrompt({ workItemId, questId: activeQuestId });
      const promptJson = JSON.stringify(promptText);

      proxy.setupLines({
        lines: [
          `{"type":"user","uuid":"sub-first","timestamp":"2026-05-13T10:00:00.000Z","message":{"role":"user","content":${promptJson}}}`,
          `{"type":"user","uuid":"sub-second","timestamp":"2026-05-13T10:00:01.000Z","message":{"role":"user","content":${promptJson}}}`,
        ],
      });

      const learned: {
        questId: QuestId;
        workItemId: QuestWorkItemId;
        sessionId: SessionId;
      }[] = [];

      startSubagentTailLayerBroker({
        agentId,
        sessionFilePath,
        processor,
        chatProcessId,
        activeQuestIdGetter: () => activeQuestId,
        emit: (): void => {
          // entries emit ignored in this scope
        },
        onSessionIdLearned: (call) => {
          learned.push(call);
        },
        subagentHandles: handles,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(learned).toStrictEqual([
        {
          questId: activeQuestId,
          workItemId,
          sessionId: SessionIdStub({ value: String(agentId) }),
        },
      ]);
    });

    it('EMPTY: {no user-text line with ids} => callback never fires', async () => {
      const proxy = startSubagentTailLayerBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'sid-proc-2' });
      const agentId = AgentIdStub({ value: 'no-ids-agent' });
      const activeQuestId = QuestIdStub({ value: 'no-ids-quest' });
      const processor = chatLineProcessTransformer();
      const handles = new Map<
        ReturnType<typeof AgentIdStub>,
        { stop: () => void; initialDrain: Promise<void> }
      >();

      proxy.setupLines({
        lines: [
          '{"type":"assistant","uuid":"no-ids-1","timestamp":"2026-05-13T10:00:00.000Z","message":{"content":[{"type":"text","text":"hi"}]}}',
        ],
      });

      const learned: unknown[] = [];

      startSubagentTailLayerBroker({
        agentId,
        sessionFilePath,
        processor,
        chatProcessId,
        activeQuestIdGetter: () => activeQuestId,
        emit: (): void => {
          // entries emit ignored
        },
        onSessionIdLearned: (call) => {
          learned.push(call);
        },
        subagentHandles: handles,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(learned).toStrictEqual([]);
    });

    it('EMPTY: {onSessionIdLearned not supplied} => existing behavior preserved, no crash', async () => {
      const proxy = startSubagentTailLayerBrokerProxy();
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
      });
      const chatProcessId = ProcessIdStub({ value: 'sid-proc-3' });
      const agentId = AgentIdStub({ value: 'no-callback-agent' });
      const activeQuestId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
      const processor = chatLineProcessTransformer();
      const handles = new Map<
        ReturnType<typeof AgentIdStub>,
        { stop: () => void; initialDrain: Promise<void> }
      >();

      const promptText = taskPrompt({ workItemId, questId: activeQuestId });
      const promptJson = JSON.stringify(promptText);

      proxy.setupLines({
        lines: [
          `{"type":"user","uuid":"sub-noop","timestamp":"2026-05-13T10:00:00.000Z","message":{"role":"user","content":${promptJson}}}`,
        ],
      });

      startSubagentTailLayerBroker({
        agentId,
        sessionFilePath,
        processor,
        chatProcessId,
        activeQuestIdGetter: () => activeQuestId,
        emit: (): void => {
          // entries emit ignored
        },
        subagentHandles: handles,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(handles.has(agentId)).toBe(true);
    });
  });

  it('VALID: {agentId already in handles map} => no second tail registered, no emit', async () => {
    const proxy = startSubagentTailLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
    });
    const chatProcessId = ProcessIdStub({ value: 'layer-proc-2' });
    const agentId = AgentIdStub({ value: 'layer-agent-2' });
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
