import { subagentWriteRouteBroker } from './subagent-write-route-broker';
import { subagentWriteRouteBrokerProxy } from './subagent-write-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

describe('subagentWriteRouteBroker', () => {
  describe('a completed subagent', () => {
    it('VALID: {completed: true} => appends its own lines and the correlation line onto the parent', async () => {
      const proxy = subagentWriteRouteBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      const sessionsDir = '/tmp/guild-1/.claude/projects/-tmp-guild-1';
      const subagentFilePath = `${sessionsDir}/seed-session-1/subagents/agent-seed-agent-1.jsonl`;
      const parentFilePath = `${sessionsDir}/seed-session-1.jsonl`;
      proxy.succeeds({ subagentFilePath, parentFilePath });

      const result = await subagentWriteRouteBroker({
        target,
        fields: {
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          taskDescription: 'Seeded task 1',
          taskPrompt: 'Research the auth system',
          lines: ['{"type":"init"}'],
          completed: true,
          sessionId: 'seed-session-1',
          cwd: '/tmp/guild-1',
        },
      });

      expect(result).toStrictEqual({
        agentId: 'seed-agent-1',
        toolUseId: 'toolu_seed1',
        filePath: subagentFilePath,
        lineCount: 1,
      });

      const parentContents = String(proxy.getParentContents({ parentFilePath }));

      expect(JSON.parse(parentContents.trim())).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'toolu_seed1', content: 'done' }],
        },
        toolUseResult: { agentId: 'seed-agent-1' },
      });
    });
  });

  describe('an in-flight subagent', () => {
    it('VALID: {completed: false} => appends its own lines only, no correlation line', async () => {
      const proxy = subagentWriteRouteBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      const sessionsDir = '/tmp/guild-1/.claude/projects/-tmp-guild-1';
      const subagentFilePath = `${sessionsDir}/seed-session-1/subagents/agent-seed-agent-1.jsonl`;
      const parentFilePath = `${sessionsDir}/seed-session-1.jsonl`;
      proxy.succeeds({ subagentFilePath, parentFilePath });

      await subagentWriteRouteBroker({
        target,
        fields: {
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          taskDescription: 'Seeded task 1',
          taskPrompt: 'Research the auth system',
          lines: ['{"type":"init"}'],
          completed: false,
          sessionId: 'seed-session-1',
          cwd: '/tmp/guild-1',
        },
      });

      expect(proxy.getParentContents({ parentFilePath })).toBe(undefined);
    });
  });
});
