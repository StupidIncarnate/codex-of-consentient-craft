import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { questNewBrokerProxy } from '../../brokers/quest/new/quest-new-broker.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';

export const QuestNewChatLayerWidgetProxy = (): {
  setupQuestNew: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupQuestNewError: () => void;
  typeMessage: (params: { text: string }) => Promise<void>;
  clickSend: () => Promise<void>;
} => {
  const questNew = questNewBrokerProxy();
  const chatPanel = ChatPanelWidgetProxy();

  return {
    setupQuestNew: ({ questId, chatProcessId }) => {
      questNew.setupNew({ questId, chatProcessId });
    },
    setupQuestNewError: () => {
      questNew.setupError();
    },
    typeMessage: async ({ text }) => {
      await chatPanel.typeMessage({ text });
    },
    clickSend: async () => {
      await chatPanel.clickSend();
    },
  };
};
