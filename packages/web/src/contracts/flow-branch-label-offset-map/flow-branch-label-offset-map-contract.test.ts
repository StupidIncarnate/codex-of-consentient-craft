import { flowBranchLabelOffsetMapContract } from './flow-branch-label-offset-map-contract';
import { FlowBranchLabelOffsetMapStub } from './flow-branch-label-offset-map.stub';

describe('flowBranchLabelOffsetMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {two branch offsets} => parses successfully', () => {
      const result = flowBranchLabelOffsetMapContract.parse({
        'dec-to-left': -40,
        'dec-to-down': 40,
      });

      expect(result).toStrictEqual({ 'dec-to-left': -40, 'dec-to-down': 40 });
    });

    it('EMPTY: {} => parses empty map', () => {
      const result = flowBranchLabelOffsetMapContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: stub default => produces the two-branch offset map', () => {
      const result = FlowBranchLabelOffsetMapStub();

      expect(result).toStrictEqual({ 'dec-to-left': -40, 'dec-to-down': 40 });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {offset is a string} => throws validation error', () => {
      expect(() => {
        flowBranchLabelOffsetMapContract.parse({ 'bad-edge': 'not-a-number' });
      }).toThrow(/Expected number/u);
    });
  });
});
