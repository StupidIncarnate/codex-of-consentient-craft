import {
  AbsoluteFilePathStub,
  AgentIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { claudeCodeSubagentFindByWorkItemIdBroker } from './claude-code-subagent-find-by-work-item-id-broker';
import { claudeCodeSubagentFindByWorkItemIdBrokerProxy } from './claude-code-subagent-find-by-work-item-id-broker.proxy';

describe('claudeCodeSubagentFindByWorkItemIdBroker', () => {
  it('VALID: {first line of an agent file embeds workItemId} => returns that agent’s realAgentId', async () => {
    const proxy = claudeCodeSubagentFindByWorkItemIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirFiles({ files: ['agent-acd35f7b7763e33e8.jsonl', 'agent-other.jsonl'] });
    proxy.setupFileContents({
      filename: 'agent-acd35f7b7763e33e8.jsonl',
      firstLine:
        '{"parentUuid":null,"isSidechain":true,"agentId":"acd35f7b7763e33e8","type":"user","message":{"role":"user","content":"Call mcp__dungeonmaster__get-agent-prompt({\\n  agent: \\"pathseeker-surface\\",\\n  workItemId: \\"875c3364-2d64-4606-b9e3-25dd365c7792\\",\\n  questId: \\"6e8fdc8b-4fb4-4536-bd99-b43b20764932\\"\\n})"}}',
    });
    proxy.setupFileContents({
      filename: 'agent-other.jsonl',
      firstLine:
        '{"type":"user","message":{"role":"user","content":"some other task with workItemId: \\"ffffffff-ffff-ffff-ffff-ffffffffffff\\""}}',
    });

    const result = await claudeCodeSubagentFindByWorkItemIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402' }),
      workItemId: QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' }),
    });

    expect(result).toBe(AgentIdStub({ value: 'acd35f7b7763e33e8' }));
  });

  it('EMPTY: {subagents dir does not exist} => returns undefined', async () => {
    const proxy = claudeCodeSubagentFindByWorkItemIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirMissing();

    const result = await claudeCodeSubagentFindByWorkItemIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402' }),
      workItemId: QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {no agent file matches the workItemId} => returns undefined', async () => {
    const proxy = claudeCodeSubagentFindByWorkItemIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirFiles({ files: ['agent-other.jsonl'] });
    proxy.setupFileContents({
      filename: 'agent-other.jsonl',
      firstLine:
        '{"type":"user","message":{"role":"user","content":"workItemId: \\"ffffffff-ffff-ffff-ffff-ffffffffffff\\""}}',
    });

    const result = await claudeCodeSubagentFindByWorkItemIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402' }),
      workItemId: QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' }),
    });

    expect(result).toBe(undefined);
  });
});
