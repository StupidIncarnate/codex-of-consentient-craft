import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { useCommentQueueBindingProxy } from '../../bindings/use-comment-queue/use-comment-queue-binding.proxy';
import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { IconButtonWidgetProxy } from '../icon-button/icon-button-widget.proxy';

type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;
type QueueProxy = ReturnType<typeof useCommentQueueBindingProxy>;

export const CommentPopoverWidgetProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  queuedAt: QueueProxy['queuedAt'];
  getStoredValue: (params: { questId: QuestId }) => unknown;
  hasStoredQueue: (params: { questId: QuestId }) => boolean;
  clickCommentButton: () => Promise<void>;
  clickFirstCommentButton: () => Promise<void>;
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
  commentButtonIcons: () => HTMLElement['className'][];
  commentButtonAlignment: () => HTMLElement['style']['justifyContent'];
  commentButtonSize: () => HTMLElement['style']['width'];
  commentButtonBackground: () => HTMLElement['style']['backgroundColor'];
  commentButtonForeground: () => HTMLElement['style']['color'];
} => {
  const queueProxy = useCommentQueueBindingProxy();
  // Every control this widget renders is an IconButtonWidget. Its proxy mocks nothing — the
  // buttons run real — so it is constructed for the child-proxy rule and never interacted with;
  // this widget's own selectors address the buttons by their comment-specific testids.
  IconButtonWidgetProxy();
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
    // Addressed by position rather than by testid: sibling boxes all render the same COMMENT_BUTTON
    // testid, so a fill test covering two boxes at once needs to name which one it presses.
    clickFirstCommentButton: async (): Promise<void> => {
      const [first] = screen.getAllByTestId('COMMENT_BUTTON');
      if (first === undefined) {
        throw new Error('no COMMENT_BUTTON was rendered');
      }
      await user.click(first);
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

    // Which glyph each bubble paints, in render order — IconMessageCircle for the hollow bubble and
    // IconMessageCircleFilled for the filled one. The tabler mock stamps each icon's component name
    // as its testid, so the name is the whole jsdom-visible difference between the two. Returning
    // the full list keeps "only THIS box is filled" assertable across sibling boxes.
    commentButtonIcons: (): HTMLElement['className'][] =>
      screen
        .queryAllByTestId('COMMENT_BUTTON')
        .map(
          (button) =>
            button.querySelector('[data-testid^="Icon"]')?.getAttribute('data-testid') ?? '',
        ),

    // The inline declaration only — jsdom has no layout engine, so this guards the MECHANISM that
    // right-aligns the bubble. The painted right edge is measured in a browser by
    // commentBoxHarness.bubbleRightAlignedOnNodeCard.
    commentButtonAlignment: (): HTMLElement['style']['justifyContent'] =>
      screen.getByTestId('COMMENT_BUTTON_ROW').style.justifyContent,
    commentButtonSize: (): HTMLElement['style']['width'] =>
      screen.getByTestId('COMMENT_BUTTON').style.getPropertyValue('--ai-size'),
    commentButtonBackground: (): HTMLElement['style']['backgroundColor'] =>
      screen.getByTestId('COMMENT_BUTTON').style.backgroundColor,
    commentButtonForeground: (): HTMLElement['style']['color'] =>
      screen.getByTestId('COMMENT_BUTTON').style.color,
  };
};
