/**
 * PURPOSE: Test proxy for QuestChatWidget — wires up the content-layer proxy and the guilds binding proxy used by the widget to resolve routing branches.
 *
 * USAGE:
 * const proxy = QuestChatWidgetProxy();
 * proxy.setupGuilds({ guilds });
 */

import { screen } from '#gateway/npm/testing-library__react';

import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';

import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { QuestChatContentLayerWidgetProxy } from './quest-chat-content-layer-widget.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const QuestChatWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupMode: (params: { mode: OrchestrationMode }) => void;
  hasQuestChat: () => boolean;
  hasQuestChatLoading: () => boolean;
  hasNotFound: () => boolean;
} => {
  const guildsBindingProxy = useGuildsBindingProxy();
  const contentLayerProxy = QuestChatContentLayerWidgetProxy();
  DumpsterRaccoonWidgetProxy();

  return {
    setupGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      guildsBindingProxy.setupGuilds({ guilds });
    },
    setupMode: ({ mode }: { mode: OrchestrationMode }): void => {
      contentLayerProxy.setupMode({ mode });
    },
    hasQuestChat: (): boolean => screen.queryByTestId('QUEST_CHAT') !== null,
    hasQuestChatLoading: (): boolean => screen.queryByTestId('QUEST_CHAT_LOADING') !== null,
    hasNotFound: (): boolean => screen.queryByTestId('NOT_FOUND') !== null,
  };
};
