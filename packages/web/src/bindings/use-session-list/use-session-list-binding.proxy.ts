import type { SessionListItemStub } from '@dungeonmaster/shared/contracts';

import { guildSessionListBrokerProxy } from '../../brokers/guild/session-list/guild-session-list-broker.proxy';

type SessionListItem = ReturnType<typeof SessionListItemStub>;

export const useSessionListBindingProxy = (): {
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupError: () => void;
} => {
  const brokerProxy = guildSessionListBrokerProxy();

  return {
    setupSessions: ({ sessions }: { sessions: SessionListItem[] }): void => {
      brokerProxy.setupSessions({ sessions });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
  };
};
