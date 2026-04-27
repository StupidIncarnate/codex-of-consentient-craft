import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { QuestLiveWorkspaceLayerWidgetProxy } from './quest-live-workspace-layer-widget.proxy';
import { QuestNewChatLayerWidgetProxy } from './quest-new-chat-layer-widget.proxy';

export const QuestChatRoutingLayerWidgetProxy = ({
  deferOpen = false,
}: { deferOpen?: boolean } = {}): {
  receiveWsMessage: (params: { data: string }) => void;
  setupQuestNew: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
} => {
  const live = QuestLiveWorkspaceLayerWidgetProxy({ deferOpen });
  const newChat = QuestNewChatLayerWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  return {
    receiveWsMessage: ({ data }: { data: string }): void => {
      live.receiveWsMessage({ data });
    },
    setupQuestNew: ({ questId, chatProcessId }) => {
      newChat.setupQuestNew({ questId, chatProcessId });
    },
  };
};
