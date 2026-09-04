import { subagentMetaContract } from './subagent-meta-contract';
import { SubagentMetaStub } from './subagent-meta.stub';

describe('subagentMetaContract', () => {
  describe('valid input', () => {
    it('VALID: {full real record} => returns the branded meta', () => {
      const result = subagentMetaContract.parse({
        agentType: 'general-purpose',
        description: 'Add pasted-image upload contract',
        toolUseId: 'toolu_013MwHATQFcXS5tJjdhV8YMP',
        spawnDepth: 1,
        model: 'sonnet',
      });

      expect(result).toStrictEqual(
        SubagentMetaStub({
          agentType: 'general-purpose',
          description: 'Add pasted-image upload contract',
          toolUseId: 'toolu_013MwHATQFcXS5tJjdhV8YMP',
          spawnDepth: 1,
          model: 'sonnet',
        }),
      );
    });

    it('VALID: {model omitted, an Explore sub-agent} => returns the branded meta', () => {
      const result = subagentMetaContract.parse({
        agentType: 'Explore',
        description: 'Find call sites for the removed broker',
        toolUseId: 'toolu_01Explore0000000000000',
        spawnDepth: 2,
      });

      expect(result).toStrictEqual(
        SubagentMetaStub({
          agentType: 'Explore',
          description: 'Find call sites for the removed broker',
          toolUseId: 'toolu_01Explore0000000000000',
          spawnDepth: 2,
        }),
      );
    });
  });

  describe('top-level spawn depth', () => {
    it('EDGE: {spawnDepth: 0} => returns the branded meta for a top-level agent', () => {
      const result = subagentMetaContract.parse({
        agentType: 'general-purpose',
        description: 'Top-level task with no parent agent',
        toolUseId: 'toolu_01TopLevel00000000000',
        spawnDepth: 0,
      });

      expect(result).toStrictEqual(
        SubagentMetaStub({
          agentType: 'general-purpose',
          description: 'Top-level task with no parent agent',
          toolUseId: 'toolu_01TopLevel00000000000',
          spawnDepth: 0,
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {spawnDepth: -1} => throws', () => {
      expect(() => SubagentMetaStub({ spawnDepth: -1 })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {spawnDepth: 1.5} => throws', () => {
      expect(() => SubagentMetaStub({ spawnDepth: 1.5 })).toThrow(/integer/u);
    });

    it('INVALID: {agentType: number} => throws', () => {
      expect(() => SubagentMetaStub({ agentType: 42 as never })).toThrow(/Expected string/u);
    });
  });

  describe('missing fields', () => {
    it('INVALID: {no toolUseId} => throws', () => {
      expect(() =>
        subagentMetaContract.parse({
          agentType: 'general-purpose',
          description: 'Add pasted-image upload contract',
          spawnDepth: 1,
        }),
      ).toThrow(/Required/u);
    });
  });
});
