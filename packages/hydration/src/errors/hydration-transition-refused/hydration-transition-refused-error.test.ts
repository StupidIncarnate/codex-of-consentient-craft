import { HydrationTransitionRefusedError } from './hydration-transition-refused-error';

describe('HydrationTransitionRefusedError', () => {
  describe('constructor()', () => {
    it('VALID: {from: "created", to: "in_progress", gateMessage} => names the ingredient, the refused move and the gate reason', () => {
      const error = new HydrationTransitionRefusedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        from: 'created',
        to: 'in_progress',
        gateMessage: 'a quest needs at least one session before it can start',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationTransitionRefusedError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" cannot go to "in_progress" from "created": a quest needs at least one session before it can start',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationTransitionRefusedError => returns true', () => {
      const error = new HydrationTransitionRefusedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        from: 'created',
        to: 'in_progress',
        gateMessage: 'refused',
      });

      expect(error instanceof HydrationTransitionRefusedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationTransitionRefusedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        from: 'created',
        to: 'in_progress',
        gateMessage: 'refused',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
