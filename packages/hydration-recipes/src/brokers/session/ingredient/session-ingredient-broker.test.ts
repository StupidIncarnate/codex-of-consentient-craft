import { sessionIngredientBroker } from './session-ingredient-broker';
import { sessionIngredientBrokerProxy } from './session-ingredient-broker.proxy';
import type { IngredientConfigData } from '@dungeonmaster/hydration/contracts';

describe('sessionIngredientBroker', () => {
  describe('identity', () => {
    it('VALID: {} => declares name "session" and its description', () => {
      sessionIngredientBrokerProxy();
      const config = sessionIngredientBroker as unknown as IngredientConfigData;

      expect({ name: config.name, description: config.description }).toStrictEqual({
        name: 'session',
        description:
          "one Claude transcript on disk for a guild's directory, holding the JSONL lines you gave it",
      });
    });
  });

  describe('routes', () => {
    it('VALID: {} => declares exactly query, remove and write — no api — with copies pointing at external:claude-cli', () => {
      sessionIngredientBrokerProxy();
      const config = sessionIngredientBroker as unknown as IngredientConfigData;

      expect({
        routeNames: Object.keys(config.routes).sort(),
        copies: config.copies,
      }).toStrictEqual({
        routeNames: ['query', 'remove', 'write'],
        copies: 'external:claude-cli',
      });
    });
  });

  describe('links and transitions', () => {
    it("VALID: {} => links to guild, writing this row's cwd off the guild's own path", () => {
      sessionIngredientBrokerProxy();
      const config = sessionIngredientBroker as unknown as IngredientConfigData;

      expect(config.links).toStrictEqual([{ of: 'guild', as: 'cwd', from: 'path' }]);
    });

    it('EMPTY: {} => declares no transitions — a session has no lifecycle', () => {
      sessionIngredientBrokerProxy();
      const config = sessionIngredientBroker as unknown as IngredientConfigData;

      expect(config.transitions).toBe(undefined);
    });
  });

  describe('extras', () => {
    it('VALID: {} => declares exactly withNestedChain', () => {
      sessionIngredientBrokerProxy();
      const config = sessionIngredientBroker as unknown as IngredientConfigData;
      const extras = config.extras as Record<PropertyKey, unknown>;

      expect(Object.keys(extras).sort()).toStrictEqual(['withNestedChain']);
    });
  });

  describe('defaults(index) — determinism', () => {
    it('VALID: {index: 0} => mints "seed-session-1"', () => {
      sessionIngredientBrokerProxy();
      const config = sessionIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(0)).toStrictEqual({ sessionId: 'seed-session-1' });
    });

    it('VALID: {index: 1} => mints "seed-session-2"', () => {
      sessionIngredientBrokerProxy();
      const config = sessionIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(1)).toStrictEqual({ sessionId: 'seed-session-2' });
    });
  });
});
