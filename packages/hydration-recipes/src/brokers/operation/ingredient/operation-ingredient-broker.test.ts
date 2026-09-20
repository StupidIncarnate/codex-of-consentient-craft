import { operationIngredientBroker } from './operation-ingredient-broker';
import { operationIngredientBrokerProxy } from './operation-ingredient-broker.proxy';
import type { IngredientConfigData } from '@dungeonmaster/hydration/contracts';

describe('operationIngredientBroker', () => {
  describe('identity', () => {
    it('VALID: {} => declares name "operation" and its description', () => {
      operationIngredientBrokerProxy();
      const config = operationIngredientBroker as unknown as IngredientConfigData;

      expect({ name: config.name, description: config.description }).toStrictEqual({
        name: 'operation',
        description: "one item on a quest's operations ledger, at whatever status you set it to",
      });
    });
  });

  describe('routes', () => {
    it('VALID: {} => declares exactly query, remove, update and write — no api — with copies pointing at questOperationsUpdateBroker', () => {
      operationIngredientBrokerProxy();
      const config = operationIngredientBroker as unknown as IngredientConfigData;

      expect({
        routeNames: Object.keys(config.routes).sort(),
        copies: config.copies,
      }).toStrictEqual({
        routeNames: ['query', 'remove', 'update', 'write'],
        copies: 'questOperationsUpdateBroker',
      });
    });
  });

  describe('links', () => {
    it('VALID: {} => links to both quest and guild', () => {
      operationIngredientBrokerProxy();
      const config = operationIngredientBroker as unknown as IngredientConfigData;

      expect(config.links).toStrictEqual([
        { of: 'quest', as: 'questId' },
        { of: 'guild', as: 'guildId' },
      ]);
    });
  });

  describe('defaults(index) — determinism', () => {
    it('VALID: {index: 0} => mints "Seeded operation 1", role codeweaver, status pending', () => {
      operationIngredientBrokerProxy();
      const config = operationIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(0)).toStrictEqual({
        text: 'Seeded operation 1',
        role: 'codeweaver',
        status: 'pending',
      });
    });

    it('VALID: {index: 1} => mints "Seeded operation 2"', () => {
      operationIngredientBrokerProxy();
      const config = operationIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(1)).toStrictEqual({
        text: 'Seeded operation 2',
        role: 'codeweaver',
        status: 'pending',
      });
    });
  });
});
