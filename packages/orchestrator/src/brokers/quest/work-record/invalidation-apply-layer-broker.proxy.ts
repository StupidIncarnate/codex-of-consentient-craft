import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';

export const invalidationApplyLayerBrokerProxy = (): {
  getPersistedQuests: () => readonly unknown[];
} => {
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
