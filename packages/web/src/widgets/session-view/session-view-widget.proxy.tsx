import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useSessionReplayBindingProxy } from '../../bindings/use-session-replay/use-session-replay-binding.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';

const isReplayHistoryMessage = (message: unknown): boolean => {
  if (typeof message !== 'object' || message === null) return false;
  const candidate = message as { type?: unknown };
  return candidate.type === 'replay-history';
};

export const SessionViewWidgetProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  setupGuilds: ReturnType<typeof useGuildsBindingProxy>['setupGuilds'];
  getReplayHistorySent: () => boolean;
  getReplayHistoryMessage: () => unknown;
  hasSubagentChain: () => boolean;
  getDurationTexts: () => HTMLElement['textContent'][];
  getDurationTestIds: () => ReturnType<Element['getAttribute']>[];
} => {
  const guildsProxy = useGuildsBindingProxy();
  const replayProxy = useSessionReplayBindingProxy();
  const panelProxy = ChatPanelWidgetProxy();
  DumpsterRaccoonWidgetProxy();

  return {
    setupConnectedChannel: () => {
      replayProxy.setupConnectedChannel();
    },
    deliverWsMessage: ({ data }) => {
      replayProxy.deliverWsMessage({ data });
    },
    setupGuilds: ({ guilds }) => {
      guildsProxy.setupGuilds({ guilds });
    },
    getReplayHistorySent: (): boolean => {
      const sent = replayProxy.getSentWsMessages();
      return sent.some(isReplayHistoryMessage);
    },
    getReplayHistoryMessage: (): unknown => {
      const sent = replayProxy.getSentWsMessages();
      return sent.find(isReplayHistoryMessage);
    },
    hasSubagentChain: (): boolean => panelProxy.hasSubagentChainCount({ count: 1 }),
    getDurationTexts: () => panelProxy.getDurationTexts(),
    getDurationTestIds: () => panelProxy.getDurationTestIds(),
  };
};
