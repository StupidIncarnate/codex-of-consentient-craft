import { flowRecipeNameContract } from './flow-recipe-name-contract';
import { FlowRecipeNameStub } from './flow-recipe-name.stub';

describe('flowRecipeNameContract', () => {
  describe('valid recipe names', () => {
    it('VALID: {value: "pc-walk-1"} => parses and returns branded FlowRecipeName', () => {
      expect(FlowRecipeNameStub({ value: 'pc-walk-1' })).toBe('pc-walk-1');
    });

    it('VALID: {value: "seed"} => parses a single kebab segment', () => {
      expect(FlowRecipeNameStub({ value: 'seed' })).toBe('seed');
    });
  });

  describe('invalid recipe names', () => {
    it('INVALID: {value: "PcWalk1"} => throws for a non-kebab-case value', () => {
      expect(() => flowRecipeNameContract.parse('PcWalk1')).toThrow(/invalid_string/u);
    });

    it('INVALID: {value: "pc_walk_1"} => throws for underscores', () => {
      expect(() => flowRecipeNameContract.parse('pc_walk_1')).toThrow(/invalid_string/u);
    });

    it('EMPTY: {value: ""} => throws', () => {
      expect(() => flowRecipeNameContract.parse('')).toThrow(/invalid_string/u);
    });
  });
});
