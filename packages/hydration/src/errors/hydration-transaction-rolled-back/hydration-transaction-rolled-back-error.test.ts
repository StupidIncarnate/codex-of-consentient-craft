import { HydrationTransactionRolledBackError } from './hydration-transaction-rolled-back-error';

describe('HydrationTransactionRolledBackError', () => {
  describe('constructor()', () => {
    it('VALID: {opDescription, cause: foreign key violation} => names the recipe, the triggering op and the underlying failure', () => {
      const error = new HydrationTransactionRolledBackError({
        recipeName: 'seed-users-and-posts',
        ingredientName: 'comment',
        opDescription: 'create comment[0:2]',
        cause: new Error('foreign key violation on post_id'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationTransactionRolledBackError',
        message:
          'recipe "seed-users-and-posts": the transaction rolled back, undoing the whole plan — triggered by create comment[0:2] on ingredient "comment": Error: foreign key violation on post_id',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationTransactionRolledBackError => returns true', () => {
      const error = new HydrationTransactionRolledBackError({
        recipeName: 'seed-users-and-posts',
        ingredientName: 'comment',
        opDescription: 'create comment[0:2]',
        cause: new Error('x'),
      });

      expect(error instanceof HydrationTransactionRolledBackError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationTransactionRolledBackError({
        recipeName: 'seed-users-and-posts',
        ingredientName: 'comment',
        opDescription: 'create comment[0:2]',
        cause: new Error('x'),
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
