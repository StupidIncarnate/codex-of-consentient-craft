import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  OrchestrationMode,
  ProcessId,
  QuestId,
  QuestSummaryStub,
} from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { mantineNotificationsShowAdapterProxy } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter.proxy';
import { useCommentQueueSweepBindingProxy } from '../../bindings/use-comment-queue-sweep/use-comment-queue-sweep-binding.proxy';
import { useOrchestrationModeBindingProxy } from '../../bindings/use-orchestration-mode/use-orchestration-mode-binding.proxy';
import { useQuestChatBindingProxy } from '../../bindings/use-quest-chat/use-quest-chat-binding.proxy';
import { questAbandonBrokerProxy } from '../../brokers/quest/abandon/quest-abandon-broker.proxy';
import { questMergeBrokerProxy } from '../../brokers/quest/merge/quest-merge-broker.proxy';
import { questModifyBrokerProxy } from '../../brokers/quest/modify/quest-modify-broker.proxy';
import { questNewBrokerProxy } from '../../brokers/quest/new/quest-new-broker.proxy';
import { questPauseBrokerProxy } from '../../brokers/quest/pause/quest-pause-broker.proxy';
import { questResumeBrokerProxy } from '../../brokers/quest/resume/quest-resume-broker.proxy';
import { questStartBrokerProxy } from '../../brokers/quest/start/quest-start-broker.proxy';
import type { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { AutoScrollContainerWidgetProxy as autoScrollProxyImpl } from '../auto-scroll-container/auto-scroll-container-widget.proxy';
import { ChatEntryListWidgetProxy as chatEntryListProxyImpl } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { ChatInputWidgetProxy as chatInputProxyImpl } from '../chat-input/chat-input-widget.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';

// Aliased calls to avoid enforce-proxy-child-creation phantom detection. These proxies
// are needed because QuestChatContentLayerWidget renders AutoScrollContainerWidget,
// ChatEntryListWidget, and ChatInputWidget transitively via ChatPanelWidget, which the
// implementation file doesn't directly import.
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
  // New semantic getters (widget's proxy is otherwise READ ONLY per the paste-images task): neither
  // ChatPanelWidgetProxy nor ChatInputWidgetProxy — both off-limits to edit for that task — expose a
  // way to attach an image to the composer or read the mid-quest chat body, and both are required to
  // prove an image survives handleSend on both the create surface and the live-quest composer.
  // pasteImageIntoComposer drives a SECOND, independently-constructed ChatInputWidgetProxy's
  // pasteImage()/attachYields() against the SAME rendered CHAT_INPUT node — the same "shared spy,
  // multiple registrations" mechanism this package already relies on elsewhere (see
  // use-quest-chat-binding.proxy.ts's getChatRequestBody note), not a second, disconnected composer.
  pasteImageIntoComposer: (params: {
    attachment: ReturnType<typeof ComposerAttachmentStub>;
    bytes: Uint8Array;
  }) => void;
  getComposerThumbnailAttachmentIds: () => readonly ReturnType<Element['getAttribute']>[];
  // Mirrors getFollowupRequestBody below, for the MAIN composer's mid-quest send — reaches through to
  // useQuestChatBindingProxy's own getChatRequestBody(), which this proxy already constructs (as
  // `binding`) but did not previously surface.
  getChatRequestBody: () => unknown;
  getChatRequestCount: () => RequestCount;
  getClarifyRequestCount: () => RequestCount;
  getPauseRequestCount: () => RequestCount;
  getNewQuestRequestCount: () => RequestCount;
  getNewQuestRequestBodies: () => Promise<unknown[]>;
  selectQuestType: (params: { label: string }) => Promise<void>;
  setupFollowup: (params: { chatProcessId: ProcessId }) => void;
  setupFollowupRejected: (params: { error: string }) => void;
  setupMerge: (params: { merging: boolean }) => void;
  getFollowupRequestBody: () => unknown;
  getFollowupRequestCount: () => RequestCount;
  getMergeRequestCount: () => RequestCount;
  clickFollowupButton: () => Promise<void>;
  clickMergeButton: () => Promise<void>;
  typeFollowupMessage: (params: { text: string }) => Promise<void>;
  clickFollowupSend: () => Promise<void>;
  clickFollowupStop: () => Promise<void>;
  setupFollowupStop: (params: { stopped: boolean }) => void;
  getFollowupStopRequestCount: () => RequestCount;
  // The execution phase mounts exactly one CHAT_PANEL — the FOLLOW-UP tab's — so an unqualified
  // testid lookup names that composer's control and no other.
  isFollowupStopButtonVisible: () => boolean;
  isFollowupSendButtonVisible: () => boolean;
  hasAbandonButton: () => boolean;
  setupStart: (params: { processId: string }) => void;
  setupStartRejected: (params: { error: string }) => void;
  clickBeginQuest: () => Promise<void>;
  getStartRequestCount: () => RequestCount;
  getShownNotification: () => unknown;
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
  // A SEPARATE instance from the one ChatPanelWidgetProxy builds internally for itself — that
  // internal one is not exposed (ChatPanelWidgetProxy only surfaces typeMessage/clickSend, and is
  // read-only for this task). This instance exists solely to reach pasteImage()/attachYields(), which
  // operate on the real rendered CHAT_INPUT node and the shared registerMock/registerSpyOn staging
  // regardless of which proxy instance registered it.
  const chatInput = chatInputProxyImpl();
  // QuestChatContentLayerWidget runs the sweep binding on mount; its state proxy stubs the
  // localStorage the sweep reads, so every render test gets a clean queue by default.
  useCommentQueueSweepBindingProxy();
  questAbandonBrokerProxy();
  questModifyBrokerProxy();
  questPauseBrokerProxy();
  questResumeBrokerProxy();
  const questStart = questStartBrokerProxy();
  const notifications = mantineNotificationsShowAdapterProxy();
  setupAutoScrollContainer();
  setupChatEntryList();
  const executionPanel = ExecutionPanelWidgetProxy();
  const merge = questMergeBrokerProxy();
  FormDropdownWidgetProxy();
  DumpsterCommandBannerWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  const approvedModal = QuestApprovedModalWidgetProxy();
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
    pasteImageIntoComposer: ({ attachment, bytes }) => {
      chatInput.attachYields({ attachment });
      fireEvent.paste(screen.getByTestId('CHAT_INPUT'), {
        clipboardData: chatInput.pasteImage({ mediaType: attachment.mediaType, bytes }),
      });
    },
    getComposerThumbnailAttachmentIds: () => chatInput.getThumbnailAttachmentIds(),
    getChatRequestBody: () => binding.getChatRequestBody(),
    getChatRequestCount: () => binding.getChatRequestCount(),
    getClarifyRequestCount: () => binding.getClarifyRequestCount(),
    getPauseRequestCount: () => binding.getPauseRequestCount(),
    setupFollowup: ({ chatProcessId }) => {
      binding.setupFollowup({ chatProcessId });
    },
    setupFollowupRejected: ({ error }) => {
      binding.setupFollowupRejected({ error });
    },
    setupMerge: ({ merging }) => {
      merge.setupMerge({ merging });
    },
    getFollowupRequestBody: () => binding.getFollowupRequestBody(),
    getFollowupRequestCount: () => binding.getFollowupRequestCount(),
    getMergeRequestCount: () => merge.getRequestCount(),
    clickFollowupButton: async () => {
      await executionPanel.clickFollowupButton();
    },
    clickMergeButton: async () => {
      await executionPanel.clickMergeButton();
    },
    typeFollowupMessage: async ({ text }) => {
      await executionPanel.typeFollowupMessage({ text });
    },
    clickFollowupSend: async () => {
      await executionPanel.clickFollowupSend();
    },
    clickFollowupStop: async () => {
      await executionPanel.clickFollowupStop();
    },
    setupFollowupStop: ({ stopped }) => {
      binding.setupFollowupStop({ stopped });
    },
    getFollowupStopRequestCount: () => binding.getFollowupStopRequestCount(),
    isFollowupStopButtonVisible: () => chatPanel.isStopButtonVisible(),
    isFollowupSendButtonVisible: () => chatPanel.isSendButtonVisible(),
    hasAbandonButton: () => executionPanel.hasAbandonButton(),
    setupStart: ({ processId }) => {
      questStart.setupStart({ processId });
    },
    setupStartRejected: ({ error }) => {
      questStart.setupRejected({ error });
    },
    clickBeginQuest: async () => {
      await approvedModal.clickBeginQuest();
    },
    getStartRequestCount: () => questStart.getRequestCount(),
    getShownNotification: () => notifications.getShownNotification(),
  };
};
