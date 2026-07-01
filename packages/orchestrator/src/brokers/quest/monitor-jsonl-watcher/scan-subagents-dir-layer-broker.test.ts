import {
  FileNameStub,
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { ChatLineSourceStub } from '../../../contracts/chat-line-source/chat-line-source.stub';

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

    await scanSubagentsDirLayerBroker({
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

  it('EMPTY: {readdir throws ENOENT} => returns success without throwing, emit never called', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-2' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-empty' });

    proxy.setupSubagentDirMissing({ error: new Error('ENOENT: no such directory') });

    const emitted: unknown[] = [];

    const result = await scanSubagentsDirLayerBroker({
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

    await scanSubagentsDirLayerBroker({
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

    await scanSubagentsDirLayerBroker({
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

  it('VALID: {non-active file whose first-line prompt matches an outstanding Task} => paired and tailed even though isAgentIdActive is false', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-nested' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-nested' });

    // Shared processor pre-seeded with an OUTSTANDING Agent Task (a parent sub-agent spawned a
    // nested sub-agent). Its prompt is the byte-equal pairing key the nested file carries.
    const processor = chatLineProcessTransformer();
    processor.processLine({
      parsed: {
        type: 'assistant',
        uuid: 'nested-parent-task-uuid',
        timestamp: '2026-05-13T10:00:00.000Z',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_nested_parent',
              name: 'Agent',
              input: { prompt: 'nested slice prompt' },
            },
          ],
        },
      },
      source: ChatLineSourceStub({ value: 'session' }),
    });

    // The nested sub-agent's realAgentId is NOT a stamped work-item agentId, so the active-set
    // predicate returns false for it — the OLD gate would skip it entirely.
    proxy.setupSubagentDirFiles({ files: [FileNameStub({ value: 'agent-realnestedb.jsonl' })] });
    // First-line read: Claude CLI writes the Task prompt verbatim as the sub-agent JSONL's
    // first user-text line.
    proxy.setupFirstLineRead({
      content:
        '{"type":"user","uuid":"nested-prompt-line","timestamp":"2026-05-13T10:00:01.000Z","message":{"role":"user","content":"nested slice prompt"}}',
    });
    // Tail drain: the nested sub-agent's own activity once tailed.
    proxy.setupLines({
      lines: [
        '{"type":"assistant","uuid":"nested-text-line","timestamp":"2026-05-13T10:00:02.000Z","message":{"content":[{"type":"text","text":"nested activity"}]}}',
      ],
    });

    const emitted: unknown[] = [];
    const handles = new Map();

    await scanSubagentsDirLayerBroker({
      subagentsDir: '/home/user/.claude/projects/-home-user-proj/abc-123/subagents',
      sessionFilePath,
      parentSessionId,
      processor,
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      isAgentIdActive: () => false,
      subagentHandles: handles,
    });

    proxy.triggerChange();
    await flushImmediate();

    expect(handles.size).toBe(1);
    expect(emitted).toStrictEqual([
      {
        chatProcessId,
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'nested activity',
            // realnestedb -> toolu_nested_parent via the prompt pairing, so the nested entry
            // carries the Task toolUseId the web groups the chain on.
            agentId: 'toolu_nested_parent',
            source: 'subagent',
            uuid: 'nested-text-line:0',
            timestamp: '2026-05-13T10:00:02.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
    ]);
  });
});
