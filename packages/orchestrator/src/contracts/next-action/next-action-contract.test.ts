import { nextActionContract } from './next-action-contract';
import { NextActionStub } from './next-action.stub';

const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';

describe('nextActionContract', () => {
  describe('the mint variant', () => {
    it('VALID: {cause: plan-batch, one item} => round-trips the batch', () => {
      const action = NextActionStub({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'plan-batch',
        batch: [{ step: 'work', role: 'codeweaver', assignedUnitIds: [], needsLane: false }],
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'plan-batch',
        batch: [{ step: 'work', role: 'codeweaver', assignedUnitIds: [], needsLane: false }],
      });
    });

    it('EMPTY: {cause: capped, batch: []} => accepted, the one legal empty batch', () => {
      const action = NextActionStub({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'capped',
        batch: [],
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'capped',
        batch: [],
      });
    });
  });

  describe('the route variant', () => {
    it('VALID: {from, outcome, step, batch} => round-trips the phase transition', () => {
      const action = nextActionContract.parse({
        kind: 'route',
        operationItemId: OPERATION_ITEM_ID,
        from: 'happyWalk',
        outcome: 'done',
        step: 'adversarial',
        batch: [{ step: 'adversarial', role: 'siegemaster' }],
      });

      expect(action).toStrictEqual({
        kind: 'route',
        operationItemId: OPERATION_ITEM_ID,
        from: 'happyWalk',
        outcome: 'done',
        step: 'adversarial',
        batch: [
          { step: 'adversarial', role: 'siegemaster', assignedUnitIds: [], needsLane: false },
        ],
      });
    });

    it('EMPTY: {route with batch: []} => throws, because a route always mints something', () => {
      expect(() =>
        nextActionContract.parse({
          kind: 'route',
          operationItemId: OPERATION_ITEM_ID,
          from: 'happyWalk',
          outcome: 'done',
          step: 'adversarial',
          batch: [],
        }),
      ).toThrow(/at least 1 element/u);
    });
  });

  describe('the complete variant', () => {
    it('VALID: {outcome: empty} => round-trips the word that reached @done', () => {
      const action = nextActionContract.parse({
        kind: 'complete',
        operationItemId: OPERATION_ITEM_ID,
        outcome: 'empty',
      });

      expect(action).toStrictEqual({
        kind: 'complete',
        operationItemId: OPERATION_ITEM_ID,
        outcome: 'empty',
      });
    });
  });

  describe('the block variant', () => {
    it('VALID: {reason: max-visits} => round-trips the family, step and message', () => {
      const action = nextActionContract.parse({
        kind: 'block',
        operationItemId: OPERATION_ITEM_ID,
        family: 'codeweaver',
        step: 'work',
        reason: 'max-visits',
        message: 'maxVisits spent',
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: OPERATION_ITEM_ID,
        family: 'codeweaver',
        step: 'work',
        reason: 'max-visits',
        message: 'maxVisits spent',
      });
    });

    it('INVALID: {reason: "exploded"} => throws, the reason set is closed', () => {
      expect(() =>
        nextActionContract.parse({
          kind: 'block',
          operationItemId: OPERATION_ITEM_ID,
          family: 'codeweaver',
          step: 'work',
          reason: 'exploded',
          message: 'boom',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {kind: "idle"} => throws, the union has four members', () => {
      expect(() =>
        nextActionContract.parse({ kind: 'idle', operationItemId: OPERATION_ITEM_ID }),
      ).toThrow(/Invalid discriminator value/u);
    });
  });
});
