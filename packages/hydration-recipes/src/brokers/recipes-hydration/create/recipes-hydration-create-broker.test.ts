import { recipesHydrationCreateBroker } from './recipes-hydration-create-broker';
import { recipesHydrationCreateBrokerProxy } from './recipes-hydration-create-broker.proxy';

describe('recipesHydrationCreateBroker', () => {
  describe('the object it returns', () => {
    it('VALID: {} => returns exactly ingredient, registry, recipe, run and listing, each a function', () => {
      recipesHydrationCreateBrokerProxy();

      const result = recipesHydrationCreateBroker();

      expect(result).toStrictEqual({
        ingredient: expect.any(Function),
        registry: expect.any(Function),
        recipe: expect.any(Function),
        run: expect.any(Function),
        listing: expect.any(Function),
      });
    });

    it('VALID: {} => carries exactly these five keys', () => {
      recipesHydrationCreateBrokerProxy();

      const result = recipesHydrationCreateBroker();

      expect(Object.keys(result).sort()).toStrictEqual([
        'ingredient',
        'listing',
        'recipe',
        'registry',
        'run',
      ]);
    });
  });
});
