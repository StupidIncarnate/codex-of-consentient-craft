import { AbsoluteFilePathStub, AgentIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { claudeCodeParentSessionFindByToolUseIdBroker } from './claude-code-parent-session-find-by-tool-use-id-broker';
import { claudeCodeParentSessionFindByToolUseIdBrokerProxy } from './claude-code-parent-session-find-by-tool-use-id-broker.proxy';

describe('claudeCodeParentSessionFindByToolUseIdBroker', () => {
  it('VALID: {one session has matching meta sidecar} => returns its parentSessionId + realAgentId', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    // Top-level readdir of sessions dir — three sessions present, one of them dispatched
    // a Task() sub-agent whose toolUseId we are looking for.
    proxy.enqueueReaddir({
      entries: [
        'c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl',
        '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee.jsonl',
        '87654321-dddd-eeee-ffff-aaaaaaaaaaaa.jsonl',
      ],
    });
    // First session: empty subagents dir.
    proxy.enqueueReaddir({ entries: [] });
    // Second session: has the matching meta sidecar.
    proxy.enqueueReaddir({
      entries: ['agent-ad0775d7695b4d4eb.meta.json', 'agent-ad0775d7695b4d4eb.jsonl'],
    });
    // Third session: empty subagents dir.
    proxy.enqueueReaddir({ entries: [] });
    // The matching meta.json read.
    proxy.enqueueReadFile({
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'pathseeker-dedup dispatch',
        toolUseId: 'toolu_01KfM8kWZATagwS33eTq5fZS',
      }),
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toStrictEqual({
      parentSessionId: SessionIdStub({ value: '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee' }),
      realAgentId: AgentIdStub({ value: 'ad0775d7695b4d4eb' }),
    });
  });

  it('EMPTY: {sessions dir does not exist} => returns undefined', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.enqueueReaddirMissing();

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {no session has matching meta sidecar} => returns undefined', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.enqueueReaddir({
      entries: ['c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl'],
    });
    proxy.enqueueReaddir({ entries: ['agent-other.meta.json'] });
    proxy.enqueueReadFile({
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'unrelated',
        toolUseId: 'toolu_DIFFERENT_TOOL_USE_ID',
      }),
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {session has no subagents dir} => skipped, search continues to next session', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.enqueueReaddir({
      entries: [
        'c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl',
        '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee.jsonl',
      ],
    });
    proxy.enqueueReaddirMissing();
    proxy.enqueueReaddir({ entries: ['agent-ad0775d7695b4d4eb.meta.json'] });
    proxy.enqueueReadFile({
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'pathseeker-dedup dispatch',
        toolUseId: 'toolu_01KfM8kWZATagwS33eTq5fZS',
      }),
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toStrictEqual({
      parentSessionId: SessionIdStub({ value: '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee' }),
      realAgentId: AgentIdStub({ value: 'ad0775d7695b4d4eb' }),
    });
  });

  it('EMPTY: {malformed meta.json on disk} => skipped, no match', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.enqueueReaddir({
      entries: ['c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl'],
    });
    proxy.enqueueReaddir({ entries: ['agent-malformed.meta.json'] });
    proxy.enqueueReadFile({
      contents: '{ not valid json',
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toBe(undefined);
  });
});
