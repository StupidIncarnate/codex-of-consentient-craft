import { notifications } from '#gateway/npm/mantine__notifications';
import { consoleErrorProxy } from '#gateway/browser/console/console-error/console-error.proxy';
import { randomUuidProxy } from '#gateway/browser/crypto/random-uuid/random-uuid.proxy';
import { fireEvent, screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import type { OrchestrationMode, Quest } from '@dungeonmaster/shared/contracts';
import type { QuestSummaryStub } from '@dungeonmaster/shared/contracts/quest-summary/quest-summary.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

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
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { ExecutionPanelWidgetProxy } from '../execution-panel/execution-panel-widget.proxy';
import { FormDropdownWidgetProxy } from '../form-dropdown/form-dropdown-widget.proxy';
import { QuestApprovedModalWidgetProxy } from '../quest-approved-modal/quest-approved-modal-widget.proxy';
import { QuestLoadErrorWidgetProxy } from '../quest-load-error/quest-load-error-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';
import { QuestSummaryWidgetProxy } from '../quest-summary/quest-summary-widget.proxy';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const QuestChatContentLayerWidgetProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  setupChat: (params: { chatProcessId: string }) => void;
  setupClarify: (params: { chatProcessId: string }) => void;
  setupPause: () => void;
  setupMode: (params: { mode: OrchestrationMode }) => void;
  setupNewQuest: (params: { questId: Quest['id']; chatProcessId: string }) => void;
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
  // multiple registrations" mechanism this package already relies on elsewhere, not a second,
  // disconnected composer.
  pasteImageIntoComposer: (params: {
    attachment: ReturnType<typeof ComposerAttachmentStub>;
    bytes: Uint8Array<ArrayBuffer>;
  }) => void;
  getComposerThumbnailAttachmentIds: () => readonly ReturnType<Element['getAttribute']>[];
  // Mirrors getFollowupRequestBody below, for the MAIN composer's mid-quest send — reaches through to
  // useQuestChatBindingProxy's own getChatRequestBody(), which this proxy already constructs (as
  // `binding`) but did not previously surface.
  getChatRequestBody: () => Promise<unknown>;
  getChatRequestCount: () => number;
  getClarifyRequestCount: () => number;
  getPauseRequestCount: () => number;
  getNewQuestRequestCount: () => number;
  getNewQuestRequestBodies: () => Promise<unknown[]>;
  selectQuestType: (params: { label: string }) => Promise<void>;
  setupFollowup: (params: { chatProcessId: string }) => void;
  setupFollowupRejected: (params: { error: string }) => void;
  setupMerge: (params: { merging: boolean }) => void;
  getFollowupRequestBody: () => Promise<unknown>;
  getFollowupRequestCount: () => number;
  getMergeRequestCount: () => number;
  clickFollowupButton: () => Promise<void>;
  clickMergeButton: () => Promise<void>;
  typeFollowupMessage: (params: { text: string }) => Promise<void>;
  clickFollowupSend: () => Promise<void>;
  clickFollowupStop: () => Promise<void>;
  setupFollowupStop: (params: { stopped: boolean }) => void;
  getFollowupStopRequestCount: () => number;
  // The execution phase mounts exactly one CHAT_PANEL — the FOLLOW-UP tab's — so an unqualified
  // testid lookup names that composer's control and no other.
  isFollowupStopButtonVisible: () => boolean;
  isFollowupSendButtonVisible: () => boolean;
  hasAbandonButton: () => boolean;
  setupStart: (params: { processId: string }) => void;
  setupStartRejected: (params: { error: string }) => void;
  clickBeginQuest: () => Promise<void>;
  getStartRequestCount: () => number;
  getShownNotification: () => unknown;
} => {
  // Created BEFORE the chat binding proxy: this, the summary widget, AND the execution panel's own
  // projection binding all compose webSocketChannelStateProxy, whose WebSocket spy is addressed on
  // the same url, so the LAST registration owns the created socket. The chat binding must win,
  // because every WS frame these tests deliver goes through binding.deliverWsMessage — and the
  // summary/projection bindings' own subscriptions still see those frames, since the channel state is
  // one singleton. ExecutionPanelWidgetProxy connects that channel unconditionally at construction
  // (defaulting the projection endpoint to 404) — built AFTER the chat binding, it re-stages the spy
  // and every later deliverWsMessage lands on a socket production code never wrote to, so
  // quest-modified never reaches `quest` state.
  const summary = QuestSummaryWidgetProxy();
  const executionPanel = ExecutionPanelWidgetProxy();
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
  const isNotificationPayload = (payload: unknown): boolean =>
    typeof payload === 'object' && payload !== null;
  const notificationsHandle: MockHandle = registerMock({ fn: notifications.show });
  notificationsHandle.calledWith([isNotificationPayload]).returns(undefined);
  setupAutoScrollContainer();
  setupChatEntryList();
  const merge = questMergeBrokerProxy();
  FormDropdownWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  const approvedModal = QuestApprovedModalWidgetProxy();
  QuestLoadErrorWidgetProxy();
  QuestSpecPanelWidgetProxy();
  // Pass through: the chat binding proxy stages the ids a test asserts on, and a failing navigate's
  // log is recorded and silenced.
  randomUuidProxy();
  consoleErrorProxy();
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
      await userEvent.selectOptions(
        screen.getByTestId('FORM_DROPDOWN'),
        label,
        userEventStatics.options,
      );
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
    getChatRequestBody: async () => binding.getChatRequestBody(),
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
    getFollowupRequestBody: async () => binding.getFollowupRequestBody(),
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
    getShownNotification: () =>
      notificationsHandle.callsMatching([isNotificationPayload]).at(-1)?.[0],
  };
};
