import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RequestCount } from '@dungeonmaster/testing';
import type { QuestProjectionStub } from '@dungeonmaster/shared/contracts';

import { rxjsFilterAdapterProxy } from '../../adapters/rxjs/filter/rxjs-filter-adapter.proxy';
import { questProjectionBrokerProxy } from '../../brokers/quest/projection/quest-projection-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

type QuestProjection = ReturnType<typeof QuestProjectionStub>;

export const useQuestProjectionBindingProxy = (): {
  setupConnectedChannel: () => void;
  setupProjection: (params: { projection: QuestProjection }) => void;
  setupNotFound: () => void;
  getProjectionRequestCount: () => RequestCount;
  deliverWsMessage: (params: { data: string }) => void;
} => {
  const broker = questProjectionBrokerProxy();
  rxjsFilterAdapterProxy();
  const channel = webSocketChannelStateProxy();
  // useQuestProjectionBinding logs from the effect's outer catch only; the inner catch sets `error`
  // state instead. passthrough: true — console.error is a shared sink and React's own internal
  // warnings must keep printing normally rather than throwing for being unstaged.
  registerSpyOn({ object: globalThis.console, method: 'error', passthrough: true })
    .calledWith(['[use-quest-projection]'])
    .returns(undefined);

  return {
    setupConnectedChannel: (): void => {
      channel.setupEmpty();
      channel.connect();
      channel.triggerOpen();
    },
    setupProjection: ({ projection }: { projection: QuestProjection }): void => {
      broker.setupProjection({ projection });
    },
    setupNotFound: (): void => {
      broker.setupNotFound();
    },
    getProjectionRequestCount: (): RequestCount => broker.getRequestCount(),
    deliverWsMessage: ({ data }: { data: string }): void => {
      channel.deliverMessage({ data });
    },
  };
};
