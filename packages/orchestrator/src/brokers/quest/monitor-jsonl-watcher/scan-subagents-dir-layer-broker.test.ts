import {
  FileNameStub,
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { ChatLineSourceStub } from '../../../contracts/chat-line-source/chat-line-source.stub';

import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { scanSubagentsDirLayerBroker } from './scan-subagents-dir-layer-broker';
import { scanSubagentsDirLayerBrokerProxy } from './scan-subagents-dir-layer-broker.proxy';
import { setImmediate } from '#gateway/node/setImmediate';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

// Every file this broker tails is a Task-dispatched sub-agent of the session it belongs to,
// so pairing it against an outstanding Task's prompt is the ONLY route to a tail — there is
// no other-eligibility shortcut. `seedOutstandingTask` registers the Task tool_use the
// pairing below matches against; Claude CLI writes that same prompt verbatim as the
// sub-agent JSONL's first line.
const seedOutstandingTask = ({
  processor,
  toolUseId,
  prompt,
}: {
  processor: ReturnType<typeof chatLineProcessTransformer>;
  toolUseId: string;
  prompt: string;
}): void => {
  processor.processLine({
    parsed: {
      type: 'assistant',
      uuid: `${toolUseId}-uuid`,
      timestamp: '2026-05-13T10:00:00.000Z',
      message: {
        role: 'assistant',
        content: [{ type: 'tool_use', id: toolUseId, name: 'Agent', input: { prompt } }],
      },
    },
    source: ChatLineSourceStub({ value: 'session' }),
  });
};

describe('scanSubagentsDirLayerBroker', () => {
  it('VALID: {one agent-<id>.jsonl whose first line matches an outstanding Task prompt} => starts a tail and its lines emit through the shared processor', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-1' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan' });
    const subagentsDir = '/home/user/.claude/projects/-home-user-proj/abc-123/subagents';

    const processor = chatLineProcessTransformer();
    seedOutstandingTask({ processor, toolUseId: 'toolu_zeta', prompt: 'zeta slice prompt' });

    proxy.setupSubagentDirFiles({
      subagentsDir,
      files: [FileNameStub({ value: 'agent-zeta.jsonl' })],
    });
    proxy.setupFirstLineRead({
      subagentsDir,
      fileName: FileNameStub({ value: 'agent-zeta.jsonl' }),
      content:
        '{"type":"user","uuid":"zeta-prompt-line","timestamp":"2026-05-13T10:00:01.000Z","message":{"role":"user","content":"zeta slice prompt"}}',
    });
    proxy.setupLines({
      path: `${subagentsDir}/agent-zeta.jsonl`,
      lines: [
        '{"type":"assistant","uuid":"scan-u-1","timestamp":"2026-05-13T10:00:11.000Z","message":{"content":[{"type":"text","text":"from scan"}]}}',
      ],
    });

    const emitted: unknown[] = [];

    await scanSubagentsDirLayerBroker({
      subagentsDir,
      sessionFilePath,
      parentSessionId,
      processor,
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      subagentHandles: new Map(),
    });

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
            agentId: 'toolu_zeta',
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

    proxy.setupSubagentDirMissing({
      subagentsDir: '/home/user/.claude/projects/-home-user-proj/abc-123/subagents',
      error: new Error('ENOENT: no such directory'),
    });

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
      subagentHandles: new Map(),
    });

    expect(result).toStrictEqual({ success: true });
    expect(emitted).toStrictEqual([]);
  });

  it('VALID: {non-agent file in dir alongside a paired agent file} => only the agent file gets a tail', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-3' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-mixed' });
    const subagentsDir = '/home/user/.claude/projects/-home-user-proj/abc-123/subagents';

    const processor = chatLineProcessTransformer();
    seedOutstandingTask({ processor, toolUseId: 'toolu_omega', prompt: 'omega slice prompt' });

    proxy.setupSubagentDirFiles({
      subagentsDir,
      files: [
        FileNameStub({ value: 'notes.txt' }),
        FileNameStub({ value: 'agent-omega.jsonl' }),
        FileNameStub({ value: 'agent-no-ext' }),
      ],
    });
    proxy.setupFirstLineRead({
      subagentsDir,
      fileName: FileNameStub({ value: 'agent-omega.jsonl' }),
      content:
        '{"type":"user","uuid":"omega-prompt-line","timestamp":"2026-05-13T10:00:01.000Z","message":{"role":"user","content":"omega slice prompt"}}',
    });
    // Only ONE line batch — only the single `agent-omega.jsonl` should get a tail.
    proxy.setupLines({
      path: `${subagentsDir}/agent-omega.jsonl`,
      lines: [
        '{"type":"assistant","uuid":"scan-u-2","timestamp":"2026-05-13T10:00:12.000Z","message":{"content":[{"type":"text","text":"only omega"}]}}',
      ],
    });

    const emitted: unknown[] = [];

    await scanSubagentsDirLayerBroker({
      subagentsDir,
      sessionFilePath,
      parentSessionId,
      processor,
      chatProcessId,
      activeQuestIdGetter: () => activeQuestId,
      emit: (call) => {
        emitted.push(call);
      },
      subagentHandles: new Map(),
    });

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
            agentId: 'toolu_omega',
            uuid: 'scan-u-2:0',
            timestamp: '2026-05-13T10:00:12.000Z',
          },
        ],
        questId: activeQuestId,
        sessionId: parentSessionId,
      },
    ]);
  });

  it("VALID: {one file's first line matches an outstanding Task, a sibling's does not} => only the matching file is tailed, the stale one stays skipped", async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-filter' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-filter' });
    const subagentsDir = '/home/user/.claude/projects/-home-user-proj/abc-123/subagents';

    const processor = chatLineProcessTransformer();
    seedOutstandingTask({
      processor,
      toolUseId: 'toolu_live_agent',
      prompt: 'live agent slice prompt',
    });

    proxy.setupSubagentDirFiles({
      subagentsDir,
      files: [
        FileNameStub({ value: 'agent-stale-from-prior-run.jsonl' }),
        FileNameStub({ value: 'agent-live-agent.jsonl' }),
      ],
    });
    // The stale leftover's first line matches no outstanding Task prompt — a prior run's
    // sub-agent, or content this run never spawned.
    proxy.setupFirstLineRead({
      subagentsDir,
      fileName: FileNameStub({ value: 'agent-stale-from-prior-run.jsonl' }),
      content:
        '{"type":"user","uuid":"stale-prompt-line","timestamp":"2026-05-13T09:00:00.000Z","message":{"role":"user","content":"a prompt from a run that already ended"}}',
    });
    proxy.setupFirstLineRead({
      subagentsDir,
      fileName: FileNameStub({ value: 'agent-live-agent.jsonl' }),
      content:
        '{"type":"user","uuid":"live-prompt-line","timestamp":"2026-05-13T10:00:01.000Z","message":{"role":"user","content":"live agent slice prompt"}}',
    });
    // One batch — only the live agent's tail should drain it.
    proxy.setupLines({
      path: `${subagentsDir}/agent-live-agent.jsonl`,
      lines: [
        '{"type":"assistant","uuid":"scan-u-filter","timestamp":"2026-05-13T10:00:13.000Z","message":{"content":[{"type":"text","text":"from live agent"}]}}',
      ],
    });

    const emitted: unknown[] = [];
    const handles = new Map();

    await scanSubagentsDirLayerBroker({
      subagentsDir,
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
            agentId: 'toolu_live_agent',
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

  it('VALID: {nested sub-agent file whose first-line prompt matches an outstanding Task} => paired and tailed', async () => {
    const proxy = scanSubagentsDirLayerBrokerProxy();
    const sessionFilePath = FilePathStub({
      value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
    });
    const parentSessionId = SessionIdStub({ value: 'abc-123' });
    const chatProcessId = ProcessIdStub({ value: 'scan-proc-nested' });
    const activeQuestId = QuestIdStub({ value: 'quest-scan-nested' });
    const subagentsDir = '/home/user/.claude/projects/-home-user-proj/abc-123/subagents';

    // Shared processor pre-seeded with an OUTSTANDING Agent Task (a parent sub-agent spawned a
    // nested sub-agent). Its prompt is the byte-equal pairing key the nested file carries.
    const processor = chatLineProcessTransformer();
    seedOutstandingTask({
      processor,
      toolUseId: 'toolu_nested_parent',
      prompt: 'nested slice prompt',
    });

    proxy.setupSubagentDirFiles({
      subagentsDir,
      files: [FileNameStub({ value: 'agent-realnestedb.jsonl' })],
    });
    // First-line read: Claude CLI writes the Task prompt verbatim as the sub-agent JSONL's
    // first user-text line.
    proxy.setupFirstLineRead({
      subagentsDir,
      fileName: FileNameStub({ value: 'agent-realnestedb.jsonl' }),
      content:
        '{"type":"user","uuid":"nested-prompt-line","timestamp":"2026-05-13T10:00:01.000Z","message":{"role":"user","content":"nested slice prompt"}}',
    });
    // Tail drain: the nested sub-agent's own activity once tailed.
    proxy.setupLines({
      path: `${subagentsDir}/agent-realnestedb.jsonl`,
      lines: [
        '{"type":"assistant","uuid":"nested-text-line","timestamp":"2026-05-13T10:00:02.000Z","message":{"content":[{"type":"text","text":"nested activity"}]}}',
      ],
    });

    const emitted: unknown[] = [];
    const handles = new Map();

    await scanSubagentsDirLayerBroker({
      subagentsDir,
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
