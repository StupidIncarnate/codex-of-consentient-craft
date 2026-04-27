/**
 * PURPOSE: Test proxy for QuestChatWidget — wires up the routing layer proxy and the guilds binding proxy used by the thin wrapper.
 *
 * USAGE:
 * const proxy = QuestChatWidgetProxy();
 * proxy.setupGuilds({ guilds });
 */

import { screen } from '@testing-library/react';

import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { QuestChatRoutingLayerWidgetProxy } from './quest-chat-routing-layer-widget.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const QuestChatWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  hasQuestChat: () => boolean;
  hasQuestChatLoading: () => boolean;
  hasNotFound: () => boolean;
} => {
  const guildsBindingProxy = useGuildsBindingProxy();
  QuestChatRoutingLayerWidgetProxy();

  return {
    setupGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      guildsBindingProxy.setupGuilds({ guilds });
    },
    hasQuestChat: (): boolean => screen.queryByTestId('QUEST_CHAT') !== null,
    hasQuestChatLoading: (): boolean => screen.queryByTestId('QUEST_CHAT_LOADING') !== null,
    hasNotFound: (): boolean => screen.queryByTestId('NOT_FOUND') !== null,
  };
};
