import { subagentRemoveRouteBroker } from './subagent-remove-route-broker';
import { subagentRemoveRouteBrokerProxy } from './subagent-remove-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

describe('subagentRemoveRouteBroker', () => {
  describe('an existing subagent record', () => {
    it('VALID: {record} => removes the file at record.filePath', async () => {
      const proxy = subagentRemoveRouteBrokerProxy();
      const target = DmTargetStub({});
      const filePath =
        '/tmp/guild-1/.claude/projects/-tmp-guild-1/seed-session-1/subagents/agent-seed-agent-1.jsonl';
      proxy.succeeds({ filePath });

      const result = await subagentRemoveRouteBroker({
        target,
        record: { agentId: 'seed-agent-1', toolUseId: 'toolu_seed1', filePath, lineCount: 1 },
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
