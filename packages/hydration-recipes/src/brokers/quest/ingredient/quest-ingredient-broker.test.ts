import { questIngredientBroker } from './quest-ingredient-broker';
import { questIngredientBrokerProxy } from './quest-ingredient-broker.proxy';
import type { IngredientConfigData } from '@dungeonmaster/hydration/contracts';

describe('questIngredientBroker', () => {
  describe('identity', () => {
    it('VALID: {} => declares name "quest" and its description', () => {
      questIngredientBrokerProxy();
      const config = questIngredientBroker as unknown as IngredientConfigData;

      expect({ name: config.name, description: config.description }).toStrictEqual({
        name: 'quest',
        description:
          'one quest under a guild, at whatever status you set it to, holding whatever work items and ledger you gave it',
      });
    });
  });

  describe('routes', () => {
    it('VALID: {} => declares exactly api, query, remove, update and write, with copies pointing at questPersistBroker', () => {
      questIngredientBrokerProxy();
      const config = questIngredientBroker as unknown as IngredientConfigData;

      expect({
        routeNames: Object.keys(config.routes).sort(),
        copies: config.copies,
      }).toStrictEqual({
        routeNames: ['api', 'query', 'remove', 'update', 'write'],
        copies: 'questPersistBroker',
      });
    });
  });

  describe('links', () => {
    it("VALID: {} => links to guild, writing this row's guildId", () => {
      questIngredientBrokerProxy();
      const config = questIngredientBroker as unknown as IngredientConfigData;

      expect(config.links).toStrictEqual([{ of: 'guild', as: 'guildId' }]);
    });
  });

  describe('transitions', () => {
    it('VALID: {} => walks "status" through questReachRouteBroker, narrowed to the states a caller may ask for', () => {
      questIngredientBrokerProxy();
      const config = questIngredientBroker as unknown as IngredientConfigData;
      const transitions = config.transitions!;

      expect({ field: transitions.field, to: transitions.to }).toStrictEqual({
        field: 'status',
        to: [
          'explore_flows',
          'review_flows',
          'flows_approved',
          'explore_observables',
          'review_observables',
          'approved',
          'explore_design',
          'review_design',
          'design_approved',
          'in_progress',
          'complete',
          'abandoned',
        ],
      });
    });
  });

  describe('extras', () => {
    it('VALID: {} => declares exactly corruptToLegacySchema and withWardResultDetail', () => {
      questIngredientBrokerProxy();
      const config = questIngredientBroker as unknown as IngredientConfigData;
      const extras = config.extras as Record<PropertyKey, unknown>;

      expect(Object.keys(extras).sort()).toStrictEqual([
        'corruptToLegacySchema',
        'withWardResultDetail',
      ]);
    });
  });

  describe('defaults(index) — determinism', () => {
    it('VALID: {index: 0} => mints "Quest 1", "seeded quest 1" and status "created"', () => {
      questIngredientBrokerProxy();
      const config = questIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(0)).toStrictEqual({
        title: 'Quest 1',
        userRequest: 'seeded quest 1',
        status: 'created',
      });
    });

    it('VALID: {index: 2} => mints "Quest 3", "seeded quest 3" and status "created"', () => {
      questIngredientBrokerProxy();
      const config = questIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(2)).toStrictEqual({
        title: 'Quest 3',
        userRequest: 'seeded quest 3',
        status: 'created',
      });
    });
  });
});
