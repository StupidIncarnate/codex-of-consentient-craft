/**
 * PURPOSE: Test proxy for CommentQueueBarWidget — composes the comment-queue binding proxy and the
 * notifications adapter proxy, and owns the stub `onSend` handler the widget is rendered with, all
 * behind semantic setup/trigger/assertion methods so tests never reach through to a child proxy.
 *
 * USAGE:
 * const proxy = CommentQueueBarWidgetProxy();
 * proxy.setupQueuedComments({ questId, entries: [CommentQueueEntryStub()] });
 * mantineRenderAdapter({ ui: <CommentQueueBarWidget questId={questId} onSend={proxy.onSend} /> });
 */

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { mantineNotificationsShowAdapterProxy } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter.proxy';
import { useCommentQueueBindingProxy } from '../../bindings/use-comment-queue/use-comment-queue-binding.proxy';
import type { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';
import { CommentBatchSendResultStub } from '../../contracts/comment-batch-send-result/comment-batch-send-result.stub';
import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';

type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;
type StaleAnchor = ReturnType<typeof CommentAnchorStub>;
type SendResult = ReturnType<typeof CommentBatchSendResultStub>;
interface SendParams {
  comments: readonly QueuedEntry[];
}
type SendHandler = (params: SendParams) => Promise<SendResult>;
type SendCallCount = ReturnType<MockHandle['callsMatching']>['length'];

// useQuestChatBinding.sendCommentBatch echoes back the markdown turn it delivered so the chat panel
// can render it. The queue bar ignores that field, so one fixed value covers every success.
const DELIVERED_MESSAGE = 'Queued comments delivered to the agent.';
// What the binding rejects with when the POST never reaches the server at all.
const NETWORK_FAILURE_MESSAGE = 'Failed to fetch';

export const CommentQueueBarWidgetProxy = (): {
  onSend: SendHandler;
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  setupSendSucceeds: (params: { chatProcessId: string }) => void;
  setupSendStale: (params: { staleAnchors: StaleAnchor[] }) => void;
  setupSendServerError: (params: { error: string }) => void;
  setupSendNetworkError: () => void;
  clickClear: () => Promise<void>;
  clickClearDuringSend: () => void;
  clickSend: () => Promise<void>;
  hasBar: () => boolean;
  getCountText: () => HTMLElement['textContent'];
  hasClearButton: () => boolean;
  hasSendButton: () => boolean;
  hasStoredQueue: (params: { questId: QuestId }) => boolean;
  getStoredValue: (params: { questId: QuestId }) => unknown;
  getShownToast: () => unknown;
  getRequestCount: () => SendCallCount;
  getRequestBody: () => unknown;
} => {
  const queueProxy = useCommentQueueBindingProxy();
  const notificationsProxy = mantineNotificationsShowAdapterProxy();
  const user = userEvent.setup();

  // The widget calls onSend exactly one way — a single `{ comments }` payload object — so the
  // address is a predicate over that one invariant. Staging and reads share it, which keeps `.at()`
  // available on the read below instead of peeking at an unaddressed history.
  const isSendPayload = (payload: unknown): payload is SendParams =>
    typeof payload === 'object' && payload !== null && 'comments' in payload;
  const onSend = jest.fn<Promise<SendResult>, [SendParams]>();
  const sendHandle: MockHandle = registerMock({ fn: onSend });

  return {
    onSend,

    setupEmptyQueue: (): void => {
      queueProxy.setupEmptyQueue();
    },
    setupQueuedComments: ({
      questId,
      entries,
    }: {
      questId: QuestId;
      entries: QueuedEntry[];
    }): void => {
      queueProxy.setupQueuedComments({ questId, entries });
    },
    setupSendSucceeds: ({ chatProcessId }: { chatProcessId: string }): void => {
      sendHandle.calledWith([isSendPayload]).resolves(
        CommentBatchSendResultStub({
          outcome: 'sent',
          chatProcessId,
          deliveredMessage: DELIVERED_MESSAGE,
        }),
      );
    },
    setupSendStale: ({ staleAnchors }: { staleAnchors: StaleAnchor[] }): void => {
      sendHandle
        .calledWith([isSendPayload])
        .resolves(CommentBatchSendResultStub({ outcome: 'stale', staleAnchors }));
    },
    setupSendServerError: ({ error }: { error: string }): void => {
      sendHandle
        .calledWith([isSendPayload])
        .resolves(CommentBatchSendResultStub({ outcome: 'failed', error }));
    },
    setupSendNetworkError: (): void => {
      sendHandle.calledWith([isSendPayload]).rejects(new Error(NETWORK_FAILURE_MESSAGE));
    },

    clickClear: async (): Promise<void> => {
      await user.click(screen.getByTestId('COMMENT_CLEAR_BUTTON'));
    },
    // fireEvent.click (not userEvent.click) for the same reason clickSend uses it below: userEvent
    // honors the `disabled` attribute and never dispatches, so it cannot reach the Clear handler's
    // own `if (sending) return` guard once a send is in flight. Firing the raw DOM event is what
    // lets a test prove that guard — not the disabled attribute alone — is what keeps a mid-send
    // Clear click from wiping the queue.
    clickClearDuringSend: (): void => {
      fireEvent.click(screen.getByTestId('COMMENT_CLEAR_BUTTON'));
    },
    // fireEvent.click (not userEvent.click) so the click only flushes the SYNCHRONOUS state update
    // (setSending(true), which disables the button) and returns before the send promise settles —
    // that gap is what lets a test fire a second click while the first send is still in flight to
    // prove the re-entry guard, without a fabricated deferred-response harness.
    clickSend: async (): Promise<void> => {
      fireEvent.click(screen.getByTestId('COMMENT_SEND_BUTTON'));
      return Promise.resolve();
    },

    hasBar: (): boolean => screen.queryByTestId('COMMENT_QUEUE_BAR') !== null,
    getCountText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('COMMENT_QUEUE_COUNT')?.textContent ?? null,
    hasClearButton: (): boolean => screen.queryByTestId('COMMENT_CLEAR_BUTTON') !== null,
    hasSendButton: (): boolean => screen.queryByTestId('COMMENT_SEND_BUTTON') !== null,

    hasStoredQueue: ({ questId }: { questId: QuestId }): boolean =>
      queueProxy.hasStoredQueue({ questId }),
    getStoredValue: ({ questId }: { questId: QuestId }): unknown =>
      queueProxy.getStoredValue({ questId }),
    getShownToast: (): unknown => notificationsProxy.getShownNotification(),
    getRequestCount: (): SendCallCount => sendHandle.callsMatching([isSendPayload]).length,
    getRequestBody: (): unknown => {
      const [payload] = sendHandle.callsMatching([isSendPayload]).at(-1) ?? [];
      return isSendPayload(payload) ? payload.comments : null;
    },
  };
};
