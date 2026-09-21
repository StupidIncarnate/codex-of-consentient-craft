import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';

export const workItemPatchLayerBrokerProxy = (): {
  getPersistedQuests: () => readonly unknown[];
} => {
  // Replaced wholesale, like every sibling proxy that touches questPersistBroker's own
  // dungeonmasterHomeFindBroker → pathJoin chain — addressed by its real questFilePath argument.
  questPersistBrokerProxy();
  const persistMock = registerMock({ fn: questPersistBroker });
  persistMock.calledWith([]).resolves({ success: true as const });

  return {
    getPersistedQuests: (): readonly unknown[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return JSON.parse(String(params.contents)) as unknown;
      }),
  };
};
