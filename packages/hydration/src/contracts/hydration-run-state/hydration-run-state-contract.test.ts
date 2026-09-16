import { hydrationRunStateContract } from './hydration-run-state-contract';
import { HydrationRunStateStub } from './hydration-run-state.stub';

describe('hydrationRunStateContract', () => {
  describe('a valid recipe name', () => {
    it('VALID: {recipeName: "guild-mid-execution"} => returns {recipeName: "guild-mid-execution"}', () => {
      const result = hydrationRunStateContract.parse({ recipeName: 'guild-mid-execution' });

      expect(result).toStrictEqual({ recipeName: 'guild-mid-execution' });
    });
  });

  describe('an empty recipe name', () => {
    it('INVALID: {recipeName: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => hydrationRunStateContract.parse({ recipeName: '' })).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });

  describe('the stub default maps', () => {
    it('EMPTY: {} => records and saved default to empty maps', () => {
      const state = HydrationRunStateStub();

      expect([...state.records.entries()]).toStrictEqual([]);
      expect([...state.saved.entries()]).toStrictEqual([]);
    });
  });
});
