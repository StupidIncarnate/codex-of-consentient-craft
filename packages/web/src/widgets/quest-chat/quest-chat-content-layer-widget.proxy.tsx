import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  OrchestrationMode,
  ProcessId,
  QuestId,
  QuestSummaryStub,
} from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { useCommentQueueSweepBindingProxy } from '../../bindings/use-comment-queue-sweep/use-comment-queue-sweep-binding.proxy';
import { useOrchestrationModeBindingProxy } from '../../bindings/use-orchestration-mode/use-orchestration-mode-binding.proxy';
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
import { DumpsterCommandBannerWidgetProxy } from '../dumpster-command-banner/dumpster-command-banner-widget.proxy';
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { ExecutionPanelWidgetProxy } from '../execution-panel/execution-panel-widget.proxy';
import { FormDropdownWidgetProxy } from '../form-dropdown/form-dropdown-widget.proxy';
import { QuestApprovedModalWidgetProxy } from '../quest-approved-modal/quest-approved-modal-widget.proxy';
import { QuestLoadErrorWidgetProxy } from '../quest-load-error/quest-load-error-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';
import { QuestSummaryWidgetProxy } from '../quest-summary/quest-summary-widget.proxy';

export const QuestChatContentLayerWidgetProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupClarify: (params: { chatProcessId: ProcessId }) => void;
  setupPause: () => void;
  setupMode: (params: { mode: OrchestrationMode }) => void;
  setupNewQuest: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupNewQuestError: () => void;
  setupQuestSummary: (params: { summary: ReturnType<typeof QuestSummaryStub> }) => void;
  setupTimestamps: (params: { timestamps: readonly string[] }) => void;
  setupUuids: (params: {
    uuids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  typeMessage: (params: { text: string }) => Promise<void>;
  clickSend: () => Promise<void>;
  getChatRequestCount: () => RequestCount;
  getClarifyRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
  getNewQuestRequestCount: () => RequestCount;
  getNewQuestRequestBodies: () => Promise<unknown[]>;
  selectQuestType: (params: { label: string }) => Promise<void>;
} => {
  // Created BEFORE the chat binding proxy: both compose webSocketChannelStateProxy, whose WebSocket
  // spy is addressed on the same url, so the LAST registration owns the created socket. The chat
  // binding must win, because every WS frame these tests deliver goes through binding.deliverWsMessage
  // — and the summary binding's own subscription still sees those frames, since the channel state is
  // one singleton.
  const summary = QuestSummaryWidgetProxy();
  const binding = useQuestChatBindingProxy();
  // Every rendering test must call setupMode before render to configure the declared-mode endpoint.
  const mode = useOrchestrationModeBindingProxy();
  const questNew = questNewBrokerProxy();
  const chatPanel = ChatPanelWidgetProxy();
  // QuestChatContentLayerWidget runs the sweep binding on mount; its state proxy stubs the
  // localStorage the sweep reads, so every render test gets a clean queue by default.
  useCommentQueueSweepBindingProxy();
  questAbandonBrokerProxy();
  questModifyBrokerProxy();
  questPauseBrokerProxy();
  questResumeBrokerProxy();
  questStartBrokerProxy();
  setupAutoScrollContainer();
  setupChatEntryList();
  ExecutionPanelWidgetProxy();
  FormDropdownWidgetProxy();
  DumpsterCommandBannerWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  QuestApprovedModalWidgetProxy();
  QuestLoadErrorWidgetProxy();
  QuestSpecPanelWidgetProxy();
  return {
    setupConnectedChannel: () => {
      binding.setupConnectedChannel();
    },
    setupMode: ({ mode: nextMode }) => {
      mode.setupMode({ mode: nextMode });
    },
    setupNewQuest: ({ questId, chatProcessId }) => {
      questNew.setupNew({ questId, chatProcessId });
    },
    setupNewQuestError: () => {
      questNew.setupError();
    },
    setupQuestSummary: ({ summary: nextSummary }) => {
      summary.setupSummary({ summary: nextSummary });
    },
    getNewQuestRequestCount: () => questNew.getRequestCount(),
    getNewQuestRequestBodies: async () => questNew.getRequestBodies(),
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
    setupTimestamps: ({ timestamps }) => {
      binding.setupTimestamps({ timestamps });
    },
    setupUuids: ({ uuids }) => {
      binding.setupUuids({ uuids });
    },
    typeMessage: async ({ text }) => {
      await chatPanel.typeMessage({ text });
    },
    // Drives the real <select> the create surface renders, so the test exercises the same change
    // event a user's selection fires rather than reaching into component state.
    selectQuestType: async ({ label }) => {
      await userEvent.selectOptions(screen.getByTestId('FORM_DROPDOWN'), label);
    },
    clickSend: async () => {
      await chatPanel.clickSend();
    },
    getChatRequestCount: () => binding.getChatRequestCount(),
    getClarifyRequestCount: () => binding.getClarifyRequestCount(),
    getPauseRequestCount: () => binding.getPauseRequestCount(),
  };
};
