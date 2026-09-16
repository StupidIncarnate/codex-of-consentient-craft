import { sessionNestedChainBroker } from './session-nested-chain-broker';
import { sessionNestedChainBrokerProxy } from './session-nested-chain-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

describe('sessionNestedChainBroker', () => {
  describe('depth: 2', () => {
    it('VALID: {args: {depth: 2}} => writes exactly two nested subagent transcripts', async () => {
      const proxy = sessionNestedChainBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      const sessionsDir = '/tmp/guild-1/.claude/projects/-tmp-guild-1';
      const parentFilePath = `${sessionsDir}/seed-session-1.jsonl`;
      proxy.succeeds({
        subagentFilePaths: [
          `${sessionsDir}/seed-session-1/subagents/agent-seed-agent-1.jsonl`,
          `${sessionsDir}/seed-session-1/subagents/agent-seed-agent-1-1.jsonl`,
        ],
        parentFilePath,
      });

      const result = await sessionNestedChainBroker({
        target,
        record: { sessionId: 'seed-session-1', cwd: '/tmp/guild-1' },
        args: { depth: 2 },
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
