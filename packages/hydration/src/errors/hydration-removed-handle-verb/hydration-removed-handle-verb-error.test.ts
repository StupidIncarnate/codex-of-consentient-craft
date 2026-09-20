import { HydrationRemovedHandleVerbError } from './hydration-removed-handle-verb-error';

describe('HydrationRemovedHandleVerbError', () => {
  describe('constructor()', () => {
    it('VALID: {recipeName, ingredientName, ref, verb} => sets name, message, ref, and verb', () => {
      const error = new HydrationRemovedHandleVerbError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        ref: 'guild[0:0]/quest[0:0]',
        verb: 'set',
      });

      expect({
        name: error.name,
        message: error.message,
        ref: error.ref,
        verb: error.verb,
      }).toStrictEqual({
        name: 'HydrationRemovedHandleVerbError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" calls "set" on removed row "guild[0:0]/quest[0:0]". Once a row is removed, no further verbs may target it.',
        ref: 'guild[0:0]/quest[0:0]',
        verb: 'set',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationRemovedHandleVerbError => returns true', () => {
      const error = new HydrationRemovedHandleVerbError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        ref: 'guild[0:0]/quest[0:0]',
        verb: 'set',
      });

      expect(error instanceof HydrationRemovedHandleVerbError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationRemovedHandleVerbError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        ref: 'guild[0:0]/quest[0:0]',
        verb: 'set',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
