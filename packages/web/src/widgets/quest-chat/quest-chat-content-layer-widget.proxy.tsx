import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { useQuestChatBindingProxy } from '../../bindings/use-quest-chat/use-quest-chat-binding.proxy';
import { questAbandonBrokerProxy } from '../../brokers/quest/abandon/quest-abandon-broker.proxy';
import { questModifyBrokerProxy } from '../../brokers/quest/modify/quest-modify-broker.proxy';
import { questNewBrokerProxy } from '../../brokers/quest/new/quest-new-broker.proxy';
import { questPauseBrokerProxy } from '../../brokers/quest/pause/quest-pause-broker.proxy';
import { questResumeBrokerProxy } from '../../brokers/quest/resume/quest-resume-broker.proxy';
import { questStartBrokerProxy } from '../../brokers/quest/start/quest-start-broker.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { ExecutionPanelWidgetProxy } from '../execution-panel/execution-panel-widget.proxy';
import { QuestApprovedModalWidgetProxy } from '../quest-approved-modal/quest-approved-modal-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';

export const QuestChatContentLayerWidgetProxy = ({
  deferOpen = false,
}: { deferOpen?: boolean } = {}): {
  receiveWsMessage: (params: { data: string }) => void;
  triggerWsOpen: () => void;
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupPause: () => void;
  setupQuestNew: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupQuestNewError: () => void;
  typeMessage: (params: { text: string }) => Promise<void>;
  clickSend: () => Promise<void>;
  getChatRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
} => {
  const binding = useQuestChatBindingProxy({ deferOpen });
  const questNew = questNewBrokerProxy();
  const chatPanel = ChatPanelWidgetProxy();
  questAbandonBrokerProxy();
  questModifyBrokerProxy();
  questPauseBrokerProxy();
  questResumeBrokerProxy();
  questStartBrokerProxy();
  ExecutionPanelWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  QuestApprovedModalWidgetProxy();
  QuestSpecPanelWidgetProxy();
  return {
    receiveWsMessage: ({ data }) => {
      binding.receiveWsMessage({ data });
    },
    triggerWsOpen: () => {
      binding.triggerWsOpen();
    },
    setupChat: ({ chatProcessId }) => {
      binding.setupChat({ chatProcessId });
    },
    setupPause: () => {
      binding.setupPause();
    },
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
    getChatRequestCount: () => binding.getChatRequestCount(),
    getPauseRequestCount: () => binding.getPauseRequestCount(),
  };
};
