import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RequestCount } from '@dungeonmaster/testing';
import type { QuestSummaryStub } from '@dungeonmaster/shared/contracts';

import { rxjsFilterAdapterProxy } from '../../adapters/rxjs/filter/rxjs-filter-adapter.proxy';
import { questSummaryBrokerProxy } from '../../brokers/quest/summary/quest-summary-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

type QuestSummary = ReturnType<typeof QuestSummaryStub>;

export const useQuestSummaryBindingProxy = (): {
  setupConnectedChannel: () => void;
  setupSummary: (params: { summary: QuestSummary }) => void;
  setupNotFound: () => void;
  getSummaryRequestCount: () => RequestCount;
  deliverWsMessage: (params: { data: string }) => void;
} => {
  const broker = questSummaryBrokerProxy();
  rxjsFilterAdapterProxy();
  const channel = webSocketChannelStateProxy();
  // useQuestSummaryBinding logs from the effect's outer catch only; the inner catch sets `error`
  // state instead. passthrough: true — console.error is a shared sink and React's own internal
  // warnings must keep printing normally rather than throwing for being unstaged.
  registerSpyOn({ object: globalThis.console, method: 'error', passthrough: true })
    .calledWith(['[use-quest-summary]'])
    .returns(undefined);

  return {
    setupConnectedChannel: (): void => {
      channel.setupEmpty();
      channel.connect();
      channel.triggerOpen();
    },
    setupSummary: ({ summary }: { summary: QuestSummary }): void => {
      broker.setupSummary({ summary });
    },
    setupNotFound: (): void => {
      broker.setupNotFound();
    },
    getSummaryRequestCount: (): RequestCount => broker.getRequestCount(),
    deliverWsMessage: ({ data }: { data: string }): void => {
      channel.deliverMessage({ data });
    },
  };
};
