import { AbsoluteFilePathStub, AgentIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { claudeCodeSubagentFindByToolUseIdBroker } from './claude-code-subagent-find-by-tool-use-id-broker';
import { claudeCodeSubagentFindByToolUseIdBrokerProxy } from './claude-code-subagent-find-by-tool-use-id-broker.proxy';

describe('claudeCodeSubagentFindByToolUseIdBroker', () => {
  it('VALID: {one meta.json has matching toolUseId} => returns its realAgentId', async () => {
    const proxy = claudeCodeSubagentFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirFiles({
      files: [
        'agent-abfb49de33a23726e.meta.json',
        'agent-ad0775d7695b4d4eb.meta.json',
        'agent-abfb49de33a23726e.jsonl',
        'agent-ad0775d7695b4d4eb.jsonl',
      ],
    });
    proxy.setupMetaFileContents({
      filename: 'agent-abfb49de33a23726e.meta.json',
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'pathseeker-surface dispatch',
        toolUseId: 'toolu_01PHmWECU4PNnXJjQcHodHUh',
      }),
    });
    proxy.setupMetaFileContents({
      filename: 'agent-ad0775d7695b4d4eb.meta.json',
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'pathseeker-dedup dispatch',
        toolUseId: 'toolu_01KfM8kWZATagwS33eTq5fZS',
      }),
    });

    const result = await claudeCodeSubagentFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toBe(AgentIdStub({ value: 'ad0775d7695b4d4eb' }));
  });

  it('EMPTY: {subagents dir does not exist} => returns undefined', async () => {
    const proxy = claudeCodeSubagentFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirMissing();

    const result = await claudeCodeSubagentFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {no meta.json toolUseId matches} => returns undefined', async () => {
    const proxy = claudeCodeSubagentFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirFiles({
      files: ['agent-other.meta.json'],
    });
    proxy.setupMetaFileContents({
      filename: 'agent-other.meta.json',
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'unrelated',
        toolUseId: 'toolu_DIFFERENT_TOOL_USE_ID',
      }),
    });

    const result = await claudeCodeSubagentFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {malformed meta.json on disk} => skips it, no match for that file', async () => {
    const proxy = claudeCodeSubagentFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirFiles({
      files: ['agent-malformed.meta.json'],
    });
    proxy.setupMetaFileContents({
      filename: 'agent-malformed.meta.json',
      contents: '{ not valid json',
    });

    const result = await claudeCodeSubagentFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01KfM8kWZATagwS33eTq5fZS' }),
    });

    expect(result).toBe(undefined);
  });

  it('VALID: {filenames without .meta.json suffix are ignored} => only meta.json files participate', async () => {
    const proxy = claudeCodeSubagentFindByToolUseIdBrokerProxy();
    proxy.setupHomeDir({ path: '/home/user' });
    proxy.setupSubagentDirFiles({
      files: [
        'agent-abfb49de33a23726e.jsonl',
        'agent-abfb49de33a23726e.meta.json',
        'random-file.txt',
      ],
    });
    proxy.setupMetaFileContents({
      filename: 'agent-abfb49de33a23726e.meta.json',
      contents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'pathseeker-surface dispatch',
        toolUseId: 'toolu_01PHmWECU4PNnXJjQcHodHUh',
      }),
    });

    const result = await claudeCodeSubagentFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: '/home/user/proj' }),
      parentSessionId: SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' }),
      toolUseId: ToolUseIdStub({ value: 'toolu_01PHmWECU4PNnXJjQcHodHUh' }),
    });

    expect(result).toBe(AgentIdStub({ value: 'abfb49de33a23726e' }));
  });
});
