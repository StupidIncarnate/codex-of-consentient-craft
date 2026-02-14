import { screen } from '@testing-library/react';

import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { useQuestChatBindingProxy } from '../../bindings/use-quest-chat/use-quest-chat-binding.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { LogoWidgetProxy } from '../logo/logo-widget.proxy';
import { MapFrameWidgetProxy } from '../map-frame/map-frame-widget.proxy';

export const QuestChatWidgetProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  hasLogo: () => boolean;
  hasMapFrame: () => boolean;
  hasChatPanel: () => boolean;
  hasActivityPlaceholder: () => boolean;
  hasDivider: () => boolean;
  getActivityText: () => HTMLElement['textContent'];
} => {
  const chatBindingProxy = useQuestChatBindingProxy();
  const logoProxy = LogoWidgetProxy();
  MapFrameWidgetProxy();
  ChatPanelWidgetProxy();

  return {
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatBindingProxy.setupChat({ chatProcessId });
    },
    setupChatError: (): void => {
      chatBindingProxy.setupChatError();
    },
    receiveWsMessage: ({ data }: { data: string }): void => {
      chatBindingProxy.receiveWsMessage({ data });
    },
    hasLogo: (): boolean => logoProxy.hasLogoGroup(),
    hasMapFrame: (): boolean => screen.queryByTestId('MAP_FRAME') !== null,
    hasChatPanel: (): boolean => screen.queryByTestId('CHAT_PANEL') !== null,
    hasActivityPlaceholder: (): boolean => screen.queryByTestId('QUEST_CHAT_ACTIVITY') !== null,
    hasDivider: (): boolean => screen.queryByTestId('QUEST_CHAT_DIVIDER') !== null,
    getActivityText: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('QUEST_CHAT_ACTIVITY');
      return element?.textContent ?? null;
    },
  };
};
