import {
  FileNameStub,
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';

import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { scanSubagentsDirLayerBroker } from './scan-subagents-dir-layer-broker';
import { scanSubagentsDirLayerBrokerProxy } from './scan-subagents-dir-layer-broker.proxy';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('scanSubagentsDirLayerBroker', () => {
  it('VALID: {one agent-<id>.jsonl in dir} => starts a tail and its lines emit through the shared processor', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-1' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan' });

    proxy.setupSubagentDirFiles({
      files: [FileNameStub({ value: 'agent-zeta.jsonl' })],
    });
    proxy.setupLines({
      lines: [
        '{"type":"assistant","uuid":"scan-u-1","timestamp":"2026-05-13T10:00:11.000Z","message":{"content":[{"type":"text","text":"from scan"}]}}',
      ],
    });

    const emitted: unknown[] = [];

    scanSubagentsDirLayerBroker({
      subagentsDir: '/home/user/.claude/projects/-home-user-proj/abc-123/subagents',
      sessionFilePath,
      parentSessionId,
      processor: chatLineProcessTransformer(),
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      isAgentIdActive: () => true,
      subagentHandles: new Map(),
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
            content: 'from scan',
            source: 'subagent',
            agentId: 'zeta',
            uuid: 'scan-u-1:0',
            timestamp: '2026-05-13T10:00:11.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
    ]);
  });

  it('EMPTY: {readdir throws ENOENT} => returns success without throwing, emit never called', () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-2' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-empty' });

    proxy.setupSubagentDirMissing({ error: new Error('ENOENT: no such directory') });

    const emitted: unknown[] = [];

    const result = scanSubagentsDirLayerBroker({
      subagentsDir: '/home/user/.claude/projects/-home-user-proj/abc-123/subagents',
      sessionFilePath,
      parentSessionId,
      processor: chatLineProcessTransformer(),
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      isAgentIdActive: () => true,
      subagentHandles: new Map(),
    });

    expect(result).toStrictEqual({ success: true });
    expect(emitted).toStrictEqual([]);
  });

  it('VALID: {non-agent file in dir alongside agent file} => only the agent file gets a tail', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-3' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-mixed' });

    proxy.setupSubagentDirFiles({
      files: [
        FileNameStub({ value: 'notes.txt' }),
        FileNameStub({ value: 'agent-omega.jsonl' }),
        FileNameStub({ value: 'agent-no-ext' }),
      ],
    });
    // Only ONE line batch — only the single `agent-omega.jsonl` should get a tail.
    proxy.setupLines({
      lines: [
        '{"type":"assistant","uuid":"scan-u-2","timestamp":"2026-05-13T10:00:12.000Z","message":{"content":[{"type":"text","text":"only omega"}]}}',
      ],
    });

    const emitted: unknown[] = [];

    scanSubagentsDirLayerBroker({
      subagentsDir: '/home/user/.claude/projects/-home-user-proj/abc-123/subagents',
      sessionFilePath,
      parentSessionId,
      processor: chatLineProcessTransformer(),
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      isAgentIdActive: () => true,
      subagentHandles: new Map(),
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
            content: 'only omega',
            source: 'subagent',
            agentId: 'omega',
            uuid: 'scan-u-2:0',
            timestamp: '2026-05-13T10:00:12.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
    ]);
  });

  it('VALID: {stale agentId not in active set} => file is skipped, no tail registered, no emit', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-filter' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-filter' });
    const activeAgentId = AgentIdStub({ value: 'live-agent' });

    proxy.setupSubagentDirFiles({
      files: [
        FileNameStub({ value: 'agent-stale-from-prior-run.jsonl' }),
        FileNameStub({ value: 'agent-live-agent.jsonl' }),
      ],
    });
    // One batch — only the live agent's tail should drain it.
    proxy.setupLines({
      lines: [
        '{"type":"assistant","uuid":"scan-u-filter","timestamp":"2026-05-13T10:00:13.000Z","message":{"content":[{"type":"text","text":"from live agent"}]}}',
      ],
    });

    const emitted: unknown[] = [];
    const handles = new Map();

    scanSubagentsDirLayerBroker({
      subagentsDir: '/home/user/.claude/projects/-home-user-proj/abc-123/subagents',
      sessionFilePath,
      parentSessionId,
      processor: chatLineProcessTransformer(),
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      isAgentIdActive: ({ agentId }) => String(agentId) === String(activeAgentId),
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
            content: 'from live agent',
            source: 'subagent',
            agentId: 'live-agent',
            uuid: 'scan-u-filter:0',
            timestamp: '2026-05-13T10:00:13.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
    ]);
    expect(handles.size).toBe(1);
  });
});
