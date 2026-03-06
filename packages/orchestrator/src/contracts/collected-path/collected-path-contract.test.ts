import { collectedPathContract } from './collected-path-contract';
import { CollectedPathStub } from './collected-path.stub';

describe('collectedPathContract', () => {
  describe('valid paths', () => {
    it('VALID: {steps, terminalNodeId} => parses successfully', () => {
      const path = CollectedPathStub();

      const result = collectedPathContract.parse(path);

      expect(result).toStrictEqual({
        steps: [{ nodeId: 'start', transition: null }],
        terminalNodeId: 'end-state',
      });
    });

    it('VALID: {multiple steps with transitions} => parses successfully', () => {
      const path = CollectedPathStub({
        steps: [
          { nodeId: 'start', transition: null },
          { nodeId: 'end-state', transition: 'next' },
        ],
        terminalNodeId: 'end-state',
      });

      const result = collectedPathContract.parse(path);

      expect(result).toStrictEqual({
        steps: [
          { nodeId: 'start', transition: null },
          { nodeId: 'end-state', transition: 'next' },
        ],
        terminalNodeId: 'end-state',
      });
    });
  });

  describe('invalid paths', () => {
    it('INVALID_MULTIPLE: {missing fields} => throws validation error', () => {
      expect(() => {
        return collectedPathContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
