import { dmRegistryBroker } from './dm-registry-broker';
import { dmRegistryBrokerProxy } from './dm-registry-broker.proxy';
import type { HydrationCollectionData } from '@dungeonmaster/hydration/contracts';

describe('dmRegistryBroker', () => {
  describe('accessors', () => {
    it('VALID: {} => carries exactly guilds, operations, quests, run, sessions and subagents', () => {
      dmRegistryBrokerProxy();

      expect(Object.keys(dmRegistryBroker).sort()).toStrictEqual([
        'guilds',
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
});
