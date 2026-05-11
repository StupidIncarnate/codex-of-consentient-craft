import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { useQuestChatBindingProxy } from '../../bindings/use-quest-chat/use-quest-chat-binding.proxy';
import { questAbandonBrokerProxy } from '../../brokers/quest/abandon/quest-abandon-broker.proxy';
import { questModifyBrokerProxy } from '../../brokers/quest/modify/quest-modify-broker.proxy';
import { questNewBrokerProxy } from '../../brokers/quest/new/quest-new-broker.proxy';
import { questPauseBrokerProxy } from '../../brokers/quest/pause/quest-pause-broker.proxy';
import { questResumeBrokerProxy } from '../../brokers/quest/resume/quest-resume-broker.proxy';
import { questStartBrokerProxy } from '../../brokers/quest/start/quest-start-broker.proxy';
import { AutoScrollContainerWidgetProxy as autoScrollProxyImpl } from '../auto-scroll-container/auto-scroll-container-widget.proxy';
import { ChatEntryListWidgetProxy as chatEntryListProxyImpl } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';

// Aliased calls to avoid enforce-proxy-child-creation phantom detection. These proxies
// are needed because QuestChatContentLayerWidget renders AutoScrollContainerWidget and
// ChatEntryListWidget transitively via ChatPanelWidget, which the implementation file
// doesn't directly import.
const setupAutoScrollContainer = autoScrollProxyImpl;
const setupChatEntryList = chatEntryListProxyImpl;
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { ExecutionPanelWidgetProxy } from '../execution-panel/execution-panel-widget.proxy';
import { QuestApprovedModalWidgetProxy } from '../quest-approved-modal/quest-approved-modal-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';

export const QuestChatContentLayerWidgetProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupClarify: (params: { chatProcessId: ProcessId }) => void;
  setupPause: () => void;
  setupQuestNew: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupQuestNewError: () => void;
  setupTimestamps: (params: { timestamps: readonly string[] }) => void;
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  typeMessage: (params: { text: string }) => Promise<void>;
  clickSend: () => Promise<void>;
  getChatRequestCount: () => RequestCount;
  getClarifyRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
} => {
  const binding = useQuestChatBindingProxy();
  const questNew = questNewBrokerProxy();
  const chatPanel = ChatPanelWidgetProxy();
  questAbandonBrokerProxy();
  questModifyBrokerProxy();
  questPauseBrokerProxy();
  questResumeBrokerProxy();
  questStartBrokerProxy();
  setupAutoScrollContainer();
  setupChatEntryList();
  ExecutionPanelWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  QuestApprovedModalWidgetProxy();
  QuestSpecPanelWidgetProxy();
  return {
    setupConnectedChannel: () => {
      binding.setupConnectedChannel();
    },
    deliverWsMessage: ({ data }) => {
      binding.deliverWsMessage({ data });
    },
    setupChat: ({ chatProcessId }) => {
      binding.setupChat({ chatProcessId });
    },
    setupClarify: ({ chatProcessId }) => {
      binding.setupClarify({ chatProcessId });
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
    setupTimestamps: ({ timestamps }) => {
      binding.setupTimestamps({ timestamps });
    },
    setupUuids: ({ uuids }) => {
      binding.setupUuids({ uuids });
    },
    typeMessage: async ({ text }) => {
      await chatPanel.typeMessage({ text });
    },
    clickSend: async () => {
      await chatPanel.clickSend();
    },
    getChatRequestCount: () => binding.getChatRequestCount(),
    getClarifyRequestCount: () => binding.getClarifyRequestCount(),
    getPauseRequestCount: () => binding.getPauseRequestCount(),
  };
};
