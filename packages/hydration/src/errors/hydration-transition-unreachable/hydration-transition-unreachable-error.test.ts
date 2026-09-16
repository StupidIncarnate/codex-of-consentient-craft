import { HydrationTransitionUnreachableError } from './hydration-transition-unreachable-error';

describe('HydrationTransitionUnreachableError', () => {
  describe('constructor()', () => {
    it('VALID: {recipeName, ingredientName, to: "blocked", reachableStates} => names the recipe, the ingredient, the refused "to" and the reachable states', () => {
      const error = new HydrationTransitionUnreachableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        to: 'blocked',
        reachableStates: ['created', 'in_progress'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationTransitionUnreachableError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" asks a transition for "blocked", which is not one of the states it reaches by asking. States it can reach: created, in_progress',
      });
    });

    it('EDGE: {reachableStates: one entry} => joins with no separator', () => {
      const error = new HydrationTransitionUnreachableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'session',
        to: 'archived',
        reachableStates: ['active'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationTransitionUnreachableError',
        message:
          'recipe "guild-mid-execution": ingredient "session" asks a transition for "archived", which is not one of the states it reaches by asking. States it can reach: active',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationTransitionUnreachableError => returns true', () => {
      const error = new HydrationTransitionUnreachableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        to: 'blocked',
        reachableStates: ['created', 'in_progress'],
      });

      expect(error instanceof HydrationTransitionUnreachableError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationTransitionUnreachableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        to: 'blocked',
        reachableStates: ['created', 'in_progress'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
