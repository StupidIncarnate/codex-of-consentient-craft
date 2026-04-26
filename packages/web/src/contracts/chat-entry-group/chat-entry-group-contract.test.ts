import { chatEntryGroupContract } from './chat-entry-group-contract';
import { SingleGroupStub, SubagentChainGroupStub } from './chat-entry-group.stub';

describe('chatEntryGroupContract', () => {
  describe('single group', () => {
    it('VALID: {kind: single, entry: user} => parses successfully', () => {
      const result = chatEntryGroupContract.parse(SingleGroupStub());

      expect(result.kind).toBe('single');
    });
  });

  describe('subagent chain group', () => {
    it('VALID: {kind: subagent-chain, agentId, innerGroups} => parses successfully', () => {
      const result = chatEntryGroupContract.parse(SubagentChainGroupStub());

      expect(result.kind).toBe('subagent-chain');
    });
  });
});
