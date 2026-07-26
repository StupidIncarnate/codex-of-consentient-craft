import { AbsoluteFilePathStub, AgentIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
import { claudeCodeParentSessionFindByToolUseIdBroker } from './claude-code-parent-session-find-by-tool-use-id-broker';
import { claudeCodeParentSessionFindByToolUseIdBrokerProxy } from './claude-code-parent-session-find-by-tool-use-id-broker.proxy';

const HOMEDIR = '/home/user';
const PROJECT_DIR = '/home/user/proj';

describe('claudeCodeParentSessionFindByToolUseIdBroker', () => {
  it('VALID: {sub-agent JSONL contains the toolUseId in a tool_use line} => returns its parentSessionId + realAgentId', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    const targetSessionId = '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee';
    proxy.setupSessionsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionIds: [
        'c2f964f7-31b7-4ac6-88f7-e7a985d8c671',
        targetSessionId,
        '87654321-dddd-eeee-ffff-aaaaaaaaaaaa',
      ],
    });
    proxy.setupSubagentsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671',
      agentFilenames: [],
    });
    proxy.setupSubagentsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId: targetSessionId,
      agentFilenames: ['agent-ad0775d7695b4d4eb.jsonl'],
    });
    proxy.setupSubagentsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId: '87654321-dddd-eeee-ffff-aaaaaaaaaaaa',
      agentFilenames: [],
    });
    proxy.setupAgentFile({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId: targetSessionId,
      agentFilename: 'agent-ad0775d7695b4d4eb.jsonl',
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
      projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toStrictEqual({
      parentSessionId: SessionIdStub({ value: targetSessionId }),
      realAgentId: AgentIdStub({ value: 'ad0775d7695b4d4eb' }),
    });
  });

  it('EMPTY: {sessions dir does not exist} => returns undefined', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    proxy.setupSessionsDirMissing({ homedir: HOMEDIR, projectDir: PROJECT_DIR });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {no sub-agent JSONL contains the toolUseId} => returns undefined', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    const sessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
    proxy.setupSessionsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionIds: [sessionId],
    });
    proxy.setupSubagentsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId,
      agentFilenames: ['agent-other.jsonl'],
    });
    proxy.setupAgentFile({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId,
      agentFilename: 'agent-other.jsonl',
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
      projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {session has no subagents dir} => skipped, search continues to next session', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    const missingSessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
    const targetSessionId = '12345678-aaaa-bbbb-cccc-eeeeeeeeeeee';
    proxy.setupSessionsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionIds: [missingSessionId, targetSessionId],
    });
    proxy.setupSubagentsDirMissing({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId: missingSessionId,
    });
    proxy.setupSubagentsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId: targetSessionId,
      agentFilenames: ['agent-ad0775d7695b4d4eb.jsonl'],
    });
    proxy.setupAgentFile({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId: targetSessionId,
      agentFilename: 'agent-ad0775d7695b4d4eb.jsonl',
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
      projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toStrictEqual({
      parentSessionId: SessionIdStub({ value: targetSessionId }),
      realAgentId: AgentIdStub({ value: 'ad0775d7695b4d4eb' }),
    });
  });

  it('EMPTY: {malformed JSONL content} => skipped, no match', async () => {
    const proxy = claudeCodeParentSessionFindByToolUseIdBrokerProxy();
    const sessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
    proxy.setupSessionsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionIds: [sessionId],
    });
    proxy.setupSubagentsDir({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId,
      agentFilenames: ['agent-malformed.jsonl'],
    });
    // Pre-filter passes (line contains the substring tokens) but JSON.parse fails.
    proxy.setupAgentFile({
      homedir: HOMEDIR,
      projectDir: PROJECT_DIR,
      sessionId,
      agentFilename: 'agent-malformed.jsonl',
      contents: `{ "type":"tool_use","id":"toolu_011pw36EFwmLorR7MdaSDEQG" not valid json`,
    });

    const result = await claudeCodeParentSessionFindByToolUseIdBroker({
      projectDir: AbsoluteFilePathStub({ value: PROJECT_DIR }),
      toolUseId: ToolUseIdStub({ value: 'toolu_011pw36EFwmLorR7MdaSDEQG' }),
    });

    expect(result).toBe(undefined);
  });
});
