import { guildIngredientBroker } from './guild-ingredient-broker';
import { guildIngredientBrokerProxy } from './guild-ingredient-broker.proxy';
import type { IngredientConfigData } from '@dungeonmaster/hydration/contracts';

describe('guildIngredientBroker', () => {
  describe('identity', () => {
    it('VALID: {} => declares name "guild" and its description', () => {
      guildIngredientBrokerProxy();
      const config = guildIngredientBroker as unknown as IngredientConfigData;

      expect({ name: config.name, description: config.description }).toStrictEqual({
        name: 'guild',
        description:
          'one guild registered against a directory on disk, with its url slug derived from its name',
      });
    });
  });

  describe('routes', () => {
    it('VALID: {} => declares exactly api, write, query and remove, with copies pointing at guildAddBroker', () => {
      guildIngredientBrokerProxy();
      const config = guildIngredientBroker as unknown as IngredientConfigData;

      expect({
        routeNames: Object.keys(config.routes).sort(),
        copies: config.copies,
      }).toStrictEqual({
        routeNames: ['api', 'query', 'remove', 'write'],
        copies: 'guildAddBroker',
      });
    });
  });

  describe('links and transitions', () => {
    it('EMPTY: {} => declares neither links nor transitions — a guild is the root, with no lifecycle', () => {
      guildIngredientBrokerProxy();
      const config = guildIngredientBroker as unknown as IngredientConfigData;

      expect({ links: config.links, transitions: config.transitions }).toStrictEqual({
        links: undefined,
        transitions: undefined,
      });
    });
  });

  describe('defaults(index) — determinism', () => {
    it('VALID: {index: 0} => mints "Guild 1" and a relative path fragment ending "guild-1"', () => {
      guildIngredientBrokerProxy();
      const config = guildIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(0)).toStrictEqual({
        name: 'Guild 1',
        path: 'guilds-under-test/guild-1',
      });
    });

    it('VALID: {index: 2} => mints "Guild 3" and a relative path fragment ending "guild-3"', () => {
      guildIngredientBrokerProxy();
      const config = guildIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(2)).toStrictEqual({
        name: 'Guild 3',
        path: 'guilds-under-test/guild-3',
      });
    });

    it('VALID: {two calls, same index} => byte-identical output both times', () => {
      guildIngredientBrokerProxy();
      const config = guildIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(1)).toStrictEqual(config.defaults?.(1));
    });
  });
});
