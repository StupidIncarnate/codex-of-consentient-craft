import { hydrationRunStateContract } from './hydration-run-state-contract';
import { HydrationRunStateStub } from './hydration-run-state.stub';

describe('hydrationRunStateContract', () => {
  describe('a valid recipe name', () => {
    it('VALID: {recipeName: "guild-mid-execution"} => returns {recipeName: "guild-mid-execution"}', () => {
      const result = hydrationRunStateContract.parse({
        recipeName: 'guild-mid-execution',
        records: new Map([['quest[0:0]', { id: 'q1' }]]),
        saved: new Map([['origin', { id: 'q1' }]]),
      });

      expect(result).toStrictEqual({
        recipeName: 'guild-mid-execution',
        records: new Map([['quest[0:0]', { id: 'q1' }]]),
        saved: new Map([['origin', { id: 'q1' }]]),
      });
    });
  });

  describe('an empty recipe name', () => {
    it('INVALID: {recipeName: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() =>
        hydrationRunStateContract.parse({ recipeName: '', records: new Map(), saved: new Map() }),
      ).toThrow(/expected string to have >=1 characters/u);
    });
  });

  describe('a malformed records key', () => {
    it('INVALID: {records: Map{"nope"}} => throws the row ref pattern message', () => {
      expect(() =>
        hydrationRunStateContract.parse({
          recipeName: 'guild-mid-execution',
          records: new Map([['nope', {}]]),
          saved: new Map(),
        }),
      ).toThrow(/must be an ancestor path like 'guild\[0:0\]\/quest\[0:2\]'/u);
    });
  });

  describe('a missing saved map', () => {
    it('INVALID: {recipeName only} => throws for records and saved', () => {
      expect(() => hydrationRunStateContract.parse({ recipeName: 'guild-mid-execution' })).toThrow(
        /expected map/u,
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
