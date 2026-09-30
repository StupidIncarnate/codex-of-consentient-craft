import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';

export const workItemPatchLayerBrokerProxy = (): {
  setupPersistSucceeds: (params: { questFilePath: string }) => void;
  getPersistedQuests: () => readonly unknown[];
} => {
  // Replaced wholesale, like every sibling proxy that touches questPersistBroker's own
  // dungeonmasterHomeFindBroker → pathJoin chain — addressed by its real questFilePath argument.
  questPersistBrokerProxy();
  const persistMock = registerMock({ fn: questPersistBroker });
  return {
    setupPersistSucceeds: ({ questFilePath }: { questFilePath: string }): void => {
      persistMock.calledWith([{ questFilePath }]).resolves({ success: true as const });
    },

    getPersistedQuests: (): readonly unknown[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return JSON.parse(String(params.contents)) as unknown;
      }),
  };
};
