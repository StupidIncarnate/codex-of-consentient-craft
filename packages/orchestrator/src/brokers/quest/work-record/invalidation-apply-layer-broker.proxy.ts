import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';

export const invalidationApplyLayerBrokerProxy = (): {
  setupPersistSucceeds: (params: { questFilePath: FilePath }) => void;
  getPersistedQuests: () => readonly unknown[];
} => {
  questPersistBrokerProxy();
  const persistMock = registerMock({ fn: questPersistBroker });
  return {
    setupPersistSucceeds: ({ questFilePath }: { questFilePath: FilePath }): void => {
      persistMock.calledWith([{ questFilePath }]).resolves({ success: true as const });
    },

    getPersistedQuests: (): readonly unknown[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return JSON.parse(String(params.contents)) as unknown;
      }),
  };
};
