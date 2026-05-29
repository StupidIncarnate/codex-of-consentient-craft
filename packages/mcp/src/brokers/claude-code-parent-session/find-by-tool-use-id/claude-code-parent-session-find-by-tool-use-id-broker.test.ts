import { AbsoluteFilePathStub, AgentIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { claudeCodeParentSessionFindByToolUseIdBroker } from './claude-code-parent-session-find-by-tool-use-id-broker';
import { claudeCodeParentSessionFindByToolUseIdBrokerProxy } from './claude-code-parent-session-find-by-tool-use-id-broker.proxy';

describe('claudeCodeParentSessionFindByToolUseIdBroker', () => {
  it('VALID: {sub-agent JSONL contains the toolUseId in a tool_use line} => returns its parentSessionId + realAgentId', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.enqueueReaddir({
      entries: [
        'c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl',
        '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee.jsonl',
        '87654321-dddd-eeee-ffff-aaaaaaaaaaaa.jsonl',
      ],
    });
    proxy.enqueueReaddir({ entries: [] });
    proxy.enqueueReaddir({
      entries: ['agent-ad0775d7695b4d4eb.jsonl'],
    });
    proxy.enqueueReaddir({ entries: [] });
    proxy.enqueueReadFile({
      contents: JSON.stringify({
        agentId: 'ad0775d7695b4d4eb',
        isSidechain: true,
        parentUuid: 'parent-uuid',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_011pw36EFwmLorR7MdaSDEQG',
              name: 'mcp__dungeonmaster__get-agent-prompt',
              input: {},
            },
          ],
        },
      }),
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
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
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {no sub-agent JSONL contains the toolUseId} => returns undefined', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.enqueueReaddir({
      entries: ['c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl'],
    });
    proxy.enqueueReaddir({ entries: ['agent-other.jsonl'] });
    proxy.enqueueReadFile({
      contents: JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_DIFFERENT_TOOL_USE_ID',
              name: 'mcp__dungeonmaster__get-agent-prompt',
              input: {},
            },
          ],
        },
      }),
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
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
    proxy.enqueueReaddir({ entries: ['agent-ad0775d7695b4d4eb.jsonl'] });
    proxy.enqueueReadFile({
      contents: JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_011pw36EFwmLorR7MdaSDEQG',
              name: 'mcp__dungeonmaster__get-agent-prompt',
              input: {},
            },
          ],
        },
      }),
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toStrictEqual({
      parentSessionId: SessionIdStub({ value: '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee' }),
      realAgentId: AgentIdStub({ value: 'ad0775d7695b4d4eb' }),
    });
  });

  it('EMPTY: {malformed JSONL content} => skipped, no match', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.enqueueReaddir({
      entries: ['c2f964f7-31b7-4ac6-88f7-e7a985d8c671.jsonl'],
    });
    proxy.enqueueReaddir({ entries: ['agent-malformed.jsonl'] });
    // Pre-filter passes (line contains the substring tokens) but JSON.parse fails.
    proxy.enqueueReadFile({
      contents: `{ "type":"tool_use","id":"toolu_011pw36EFwmLorR7MdaSDEQG" not valid json`,
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toBe(undefined);
  });
});
