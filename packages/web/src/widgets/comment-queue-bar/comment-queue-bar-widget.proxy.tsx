/**
 * PURPOSE: Test proxy for CommentQueueBarWidget — composes the comment-queue binding proxy, the
 * comment-batch broker proxy, and the notifications adapter proxy behind semantic setup/trigger/
 * assertion methods, so tests never reach through to a child proxy directly.
 *
 * USAGE:
 * const proxy = CommentQueueBarWidgetProxy();
 * proxy.setupQueuedComments({ questId, entries: [CommentQueueEntryStub()] });
 */

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { mantineNotificationsShowAdapterProxy } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter.proxy';
import { useCommentQueueBindingProxy } from '../../bindings/use-comment-queue/use-comment-queue-binding.proxy';
import { questCommentBatchBrokerProxy } from '../../brokers/quest/comment-batch/quest-comment-batch-broker.proxy';
import type { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';
import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';

type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;
type StaleAnchor = ReturnType<typeof CommentAnchorStub>;
type BrokerProxy = ReturnType<typeof questCommentBatchBrokerProxy>;

export const CommentQueueBarWidgetProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  setupSendSucceeds: (params: { chatProcessId: string }) => void;
  setupSendStale: (params: { staleAnchors: StaleAnchor[] }) => void;
  setupSendServerError: (params: { error: string }) => void;
  setupSendNetworkError: () => void;
  clickClear: () => Promise<void>;
  clickSend: () => Promise<void>;
  hasBar: () => boolean;
  getCountText: () => HTMLElement['textContent'];
  hasClearButton: () => boolean;
  hasSendButton: () => boolean;
  hasStoredQueue: (params: { questId: QuestId }) => boolean;
  getStoredValue: (params: { questId: QuestId }) => unknown;
  getShownToast: () => unknown;
  getRequestCount: () => ReturnType<BrokerProxy['getRequestCount']>;
  getRequestBody: () => unknown;
} => {
  const queueProxy = useCommentQueueBindingProxy();
  const brokerProxy = questCommentBatchBrokerProxy();
  const notificationsProxy = mantineNotificationsShowAdapterProxy();
  const user = userEvent.setup();

  return {
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
      brokerProxy.setupSent({ chatProcessId });
    },
    setupSendStale: ({ staleAnchors }: { staleAnchors: StaleAnchor[] }): void => {
      brokerProxy.setupStaleAnchors({ staleAnchors });
    },
    setupSendServerError: ({ error }: { error: string }): void => {
      brokerProxy.setupServerError({ error });
    },
    setupSendNetworkError: (): void => {
      brokerProxy.setupNetworkError();
    },

    clickClear: async (): Promise<void> => {
      await user.click(screen.getByTestId('COMMENT_CLEAR_BUTTON'));
    },
    // fireEvent.click (not userEvent.click) so the click only flushes the SYNCHRONOUS state update
    // (setSending(true), which disables the button) and returns before the fetch promise settles —
    // that gap is what lets a test fire a second click while the first request is still in flight
    // to prove the re-entry guard, without a fabricated deferred-response harness.
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
    getRequestCount: (): ReturnType<BrokerProxy['getRequestCount']> =>
      brokerProxy.getRequestCount(),
    getRequestBody: (): unknown => brokerProxy.getRequestBody(),
  };
};
