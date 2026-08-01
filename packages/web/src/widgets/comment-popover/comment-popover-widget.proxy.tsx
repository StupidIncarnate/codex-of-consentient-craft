import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { useCommentQueueBindingProxy } from '../../bindings/use-comment-queue/use-comment-queue-binding.proxy';
import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';

type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;
type QueueProxy = ReturnType<typeof useCommentQueueBindingProxy>;

export const CommentPopoverWidgetProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  queuedAt: QueueProxy['queuedAt'];
  getStoredValue: (params: { questId: QuestId }) => unknown;
  hasStoredQueue: (params: { questId: QuestId }) => boolean;
  clickCommentButton: () => Promise<void>;
  typeIntoTextarea: (params: { text: HTMLTextAreaElement['value'] }) => Promise<void>;
  pressEnter: () => Promise<void>;
  pressShiftEnter: () => Promise<void>;
  clickQueue: () => Promise<void>;
  clickCancel: () => Promise<void>;
  clickEdit: () => Promise<void>;
  clickDelete: () => Promise<void>;
  hasPopover: () => boolean;
  hasTextarea: () => boolean;
  getTextareaValue: () => HTMLTextAreaElement['value'];
  getTextareaRows: () => HTMLElement['ariaRowSpan'];
  getTextareaHeight: () => HTMLElement['style']['height'];
  getQueuedText: () => HTMLElement['textContent'];
  getQueuedTextOverflowWrap: () => HTMLElement['style']['overflowWrap'];
  hasEditButton: () => boolean;
  hasDeleteButton: () => boolean;
  hasQueueButton: () => boolean;
  hasCancelButton: () => boolean;
  countCommentButtons: () => HTMLElement['childElementCount'];
} => {
  const queueProxy = useCommentQueueBindingProxy();
  const user = userEvent.setup();

  const textarea = (): HTMLTextAreaElement => screen.getByTestId('COMMENT_TEXTAREA');

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
    queuedAt: queueProxy.queuedAt,
    getStoredValue: ({ questId }: { questId: QuestId }): unknown =>
      queueProxy.getStoredValue({ questId }),
    hasStoredQueue: ({ questId }: { questId: QuestId }): boolean =>
      queueProxy.hasStoredQueue({ questId }),

    clickCommentButton: async (): Promise<void> => {
      await user.click(screen.getByTestId('COMMENT_BUTTON'));
    },
    typeIntoTextarea: async ({ text }: { text: HTMLTextAreaElement['value'] }): Promise<void> => {
      await user.type(textarea(), text);
    },
    pressEnter: async (): Promise<void> => {
      textarea().focus();
      await user.keyboard('{Enter}');
    },
    pressShiftEnter: async (): Promise<void> => {
      textarea().focus();
      await user.keyboard('{Shift>}{Enter}{/Shift}');
    },
    clickQueue: async (): Promise<void> => {
      await user.click(screen.getByTestId('COMMENT_QUEUE_BUTTON'));
    },
    clickCancel: async (): Promise<void> => {
      await user.click(screen.getByTestId('COMMENT_CANCEL_BUTTON'));
    },
    clickEdit: async (): Promise<void> => {
      await user.click(screen.getByTestId('COMMENT_EDIT_BUTTON'));
    },
    clickDelete: async (): Promise<void> => {
      await user.click(screen.getByTestId('COMMENT_DELETE_BUTTON'));
    },

    hasPopover: (): boolean => screen.queryByTestId('COMMENT_POPOVER') !== null,
    hasTextarea: (): boolean => screen.queryByTestId('COMMENT_TEXTAREA') !== null,
    getTextareaValue: (): HTMLTextAreaElement['value'] => textarea().value,
    getTextareaRows: (): HTMLElement['ariaRowSpan'] =>
      screen.getByTestId('COMMENT_TEXTAREA').getAttribute('rows'),
    getTextareaHeight: (): HTMLElement['style']['height'] => textarea().style.height,
    getQueuedText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('COMMENT_QUEUED_TEXT')?.textContent ?? null,
    // The inline declaration only — jsdom has no layout engine, so this guards the MECHANISM that
    // lets a token wrap. The painted outcome is measured in a browser by
    // commentBoxHarness.queuedTextFitsInsidePopover.
    getQueuedTextOverflowWrap: (): HTMLElement['style']['overflowWrap'] =>
      screen.getByTestId('COMMENT_QUEUED_TEXT').style.overflowWrap,
    hasEditButton: (): boolean => screen.queryByTestId('COMMENT_EDIT_BUTTON') !== null,
    hasDeleteButton: (): boolean => screen.queryByTestId('COMMENT_DELETE_BUTTON') !== null,
    hasQueueButton: (): boolean => screen.queryByTestId('COMMENT_QUEUE_BUTTON') !== null,
    hasCancelButton: (): boolean => screen.queryByTestId('COMMENT_CANCEL_BUTTON') !== null,
    countCommentButtons: (): HTMLElement['childElementCount'] =>
      screen.queryAllByTestId('COMMENT_BUTTON').length,
  };
};
