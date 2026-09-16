import { dmRegistryBrokerProxy } from './dm-registry-broker.proxy';
import { dmRegistryBroker } from './dm-registry-broker';
import { HydrationPlanStub, OpCreateStub } from '@dungeonmaster/hydration/contracts';
import type { HydrationCollectionData } from '@dungeonmaster/hydration/contracts';

describe('dmRegistryBroker', () => {
  describe('accessors', () => {
    it('VALID: {} => carries exactly guilds, listing, operations, quests, run, sessions and subagents', () => {
      dmRegistryBrokerProxy();

      expect(Object.keys(dmRegistryBroker).sort()).toStrictEqual([
        'guilds',
        'listing',
        'operations',
        'quests',
        'run',
        'sessions',
        'subagents',
      ]);
    });

    it('VALID: {} => run is a function, bound from the SAME instance registry() populated', () => {
      dmRegistryBrokerProxy();

      expect({ run: dmRegistryBroker.run }).toStrictEqual({ run: expect.any(Function) });
    });

    it('VALID: {} => each accessor inverts back to the ingredient name the registry key stands for', () => {
      dmRegistryBrokerProxy();
      const guilds = dmRegistryBroker.guilds as unknown as HydrationCollectionData;
      const operations = dmRegistryBroker.operations as unknown as HydrationCollectionData;
      const quests = dmRegistryBroker.quests as unknown as HydrationCollectionData;
      const sessions = dmRegistryBroker.sessions as unknown as HydrationCollectionData;
      const subagents = dmRegistryBroker.subagents as unknown as HydrationCollectionData;

      expect({
        guilds: guilds.ingredient,
        operations: operations.ingredient,
        quests: quests.ingredient,
        sessions: sessions.ingredient,
        subagents: subagents.ingredient,
      }).toStrictEqual({
        guilds: 'guild',
        operations: 'operation',
        quests: 'quest',
        sessions: 'session',
        subagents: 'subagent',
      });
    });
  });

  describe('listing', () => {
    // Proves listing() reads the closure registry() populated on THIS dm, not a fresh one: every
    // ingredient this package registers declares a `write` route, so a plan creating any of them
    // reports {serverless: true}. A `listing` sourced from a fresh, empty
    // recipesHydrationCreateBroker() call would instead report {serverless: false,
    // needsServerFor: 'guild'} — that call's own registry never heard of any ingredient.
    it('VALID: {a plan creating a guild and a quest} => listing().runs is {serverless: true}, reading the real registered ingredients', () => {
      dmRegistryBrokerProxy();
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            index: 0,
            ancestors: ['guild[0:0]'],
          }),
        ],
      });

      const { runs, makes } = dmRegistryBroker.listing(plan);

      expect(runs).toStrictEqual({ serverless: true });
      expect(makes).toStrictEqual([
        { ingredient: 'guild', count: 1 },
        { ingredient: 'quest', count: 1 },
      ]);
    });
  });
});
