import { subagentIngredientBroker } from './subagent-ingredient-broker';
import { subagentIngredientBrokerProxy } from './subagent-ingredient-broker.proxy';
import type { IngredientConfigData } from '@dungeonmaster/hydration/contracts';

describe('subagentIngredientBroker', () => {
  describe('identity', () => {
    it('VALID: {} => declares name "subagent" and its description', () => {
      subagentIngredientBrokerProxy();
      const config = subagentIngredientBroker as unknown as IngredientConfigData;

      expect({ name: config.name, description: config.description }).toStrictEqual({
        name: 'subagent',
        description:
          'one sub-agent transcript beside a session, linked to the Task tool use that spawned it',
      });
    });
  });

  describe('routes', () => {
    it('VALID: {} => declares exactly query, remove and write — no api — with copies pointing at claude-mock/bin/claude', () => {
      subagentIngredientBrokerProxy();
      const config = subagentIngredientBroker as unknown as IngredientConfigData;

      expect({
        routeNames: Object.keys(config.routes).sort(),
        copies: config.copies,
      }).toStrictEqual({
        routeNames: ['query', 'remove', 'write'],
        copies: 'claude-mock/bin/claude',
      });
    });
  });

  describe('links and transitions', () => {
    it('VALID: {} => links to session (via sessionId) and guild (via cwd off path)', () => {
      subagentIngredientBrokerProxy();
      const config = subagentIngredientBroker as unknown as IngredientConfigData;

      expect(config.links).toStrictEqual([
        { of: 'session', as: 'sessionId', from: 'sessionId' },
        { of: 'guild', as: 'cwd', from: 'path' },
      ]);
    });

    it('EMPTY: {} => declares no transitions — a sub-agent has no lifecycle', () => {
      subagentIngredientBrokerProxy();
      const config = subagentIngredientBroker as unknown as IngredientConfigData;

      expect(config.transitions).toBe(undefined);
    });
  });

  describe('defaults(index) — determinism', () => {
    it('VALID: {index: 0} => mints "seed-agent-1", "toolu_seed1", "Seeded task 1", completed true', () => {
      subagentIngredientBrokerProxy();
      const config = subagentIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(0)).toStrictEqual({
        agentId: 'seed-agent-1',
        toolUseId: 'toolu_seed1',
        taskDescription: 'Seeded task 1',
        completed: true,
      });
    });

    it('VALID: {index: 1} => mints "seed-agent-2", "toolu_seed2", "Seeded task 2"', () => {
      subagentIngredientBrokerProxy();
      const config = subagentIngredientBroker as unknown as IngredientConfigData;

      expect(config.defaults?.(1)).toStrictEqual({
        agentId: 'seed-agent-2',
        toolUseId: 'toolu_seed2',
        taskDescription: 'Seeded task 2',
        completed: true,
      });
    });
  });
});
