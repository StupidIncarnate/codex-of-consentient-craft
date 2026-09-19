import { subagentQueryRouteBroker } from './subagent-query-route-broker';
import { subagentQueryRouteBrokerProxy } from './subagent-query-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

describe('subagentQueryRouteBroker', () => {
  describe('one completed subagent, correlated on the parent', () => {
    it('VALID: {where: {cwd, sessionId}} => returns it with the correlated toolUseId', () => {
      const proxy = subagentQueryRouteBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      const sessionsDir = '/tmp/guild-1/.claude/projects/-tmp-guild-1';
      const parentFilePath = `${sessionsDir}/seed-session-1.jsonl`;
      const subagentsDirPath = `${sessionsDir}/seed-session-1/subagents`;
      const correlationLine = JSON.stringify({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'toolu_seed1', content: 'done' }],
        },
        toolUseResult: { agentId: 'seed-agent-1' },
      });
      proxy.succeeds({
        parentFilePath,
        parentContents: `${correlationLine}\n`,
        subagentsDirPath,
        fileNames: ['agent-seed-agent-1.jsonl'],
      });

      const result = subagentQueryRouteBroker({
        target,
        where: { cwd: '/tmp/guild-1', sessionId: 'seed-session-1' },
      });

      expect(result).toStrictEqual([
        {
          agentId: 'seed-agent-1',
          toolUseId: 'toolu_seed1',
          filePath: `${subagentsDirPath}/agent-seed-agent-1.jsonl`,
          lineCount: 1,
        },
      ]);
    });
  });
});
