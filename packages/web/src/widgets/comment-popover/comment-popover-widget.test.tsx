import {
  FlowIdStub,
  FlowNodeIdStub,
  ObservableIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';
import { iconButtonStatics } from '../../statics/icon-button/icon-button-statics';

import { CommentPopoverWidget } from './comment-popover-widget';
import { CommentPopoverWidgetProxy } from './comment-popover-widget.proxy';

const QUEST_ID = QuestIdStub({ value: 'quest-a' });
const FLOW_ID = FlowIdStub({ value: 'login-flow' });
const NODE_ID = FlowNodeIdStub({ value: 'login-page' });
const OBSERVABLE_ID = ObservableIdStub({ value: 'login-redirects-to-dashboard' });
// A review note that is ONE unbroken token — the shape a comment takes when it names a symbol.
// pre-wrap honours the author's newlines but never splits a token with no break opportunity, so
// without overflow-wrap this row paints past the fixed-width popover and the rest of the note is
// clipped. A slash-separated path would NOT reproduce it: UAX#14 permits a break after a solidus.
const LONG_TOKEN_TEXT =
  'rename boxCommentsTransformerFiltersByFlowIdAndNodeIdAndObservableIdNewestFirst please';
const SECOND_NODE_ID = FlowNodeIdStub({ value: 'login-submit' });
// The two glyphs the bubble can paint — the only thing that separates "this box owes a SEND" from
// "this box is clean" on a canvas of otherwise identical cards. These are the tabler component
// names, which the icon mock stamps as each rendered glyph's testid.
const HOLLOW_BUBBLE = 'IconMessageCircle';
const FILLED_BUBBLE = 'IconMessageCircleFilled';

describe('CommentPopoverWidget', () => {
  describe('comment button', () => {
    it('VALID: {rendered on a box} => renders exactly one COMMENT_BUTTON and no popover', () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });

      expect(proxy.countCommentButtons()).toBe(1);
      expect(proxy.hasPopover()).toBe(false);
    });

    it('VALID: {click COMMENT_BUTTON on an uncommented box} => opens the editor popover', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();

      expect(proxy.hasPopover()).toBe(true);
      expect(proxy.hasTextarea()).toBe(true);
      expect(proxy.hasQueueButton()).toBe(true);
      expect(proxy.hasCancelButton()).toBe(true);
    });

    it('VALID: {click COMMENT_BUTTON} => the click does not reach the card behind it', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      const onCardClick = jest.fn();

      mantineRenderAdapter({
        ui: (
          <div onClick={onCardClick} role="presentation">
            <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />
          </div>
        ),
      });
      await proxy.clickCommentButton();

      expect(proxy.hasPopover()).toBe(true);
      expect(onCardClick).toHaveBeenCalledTimes(0);
    });
  });

  describe('editor view', () => {
    it('VALID: {editor open} => COMMENT_TEXTAREA renders with a rows attribute of 2', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();

      expect(proxy.getTextareaRows()).toBe(String(commentQueueStatics.editor.rows));
    });

    it('VALID: {text spanning 5 lines} => the inline height grows past the two-row height', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      const twoRowHeight = proxy.getTextareaHeight();
      await proxy.typeIntoTextarea({
        text: 'one{Shift>}{Enter}{/Shift}two{Shift>}{Enter}{/Shift}three{Shift>}{Enter}{/Shift}four{Shift>}{Enter}{/Shift}five',
      });

      const fiveLineHeight =
        5 * commentQueueStatics.editor.lineHeightPx + commentQueueStatics.editor.verticalChromePx;

      expect(twoRowHeight).toBe(
        `${String(2 * commentQueueStatics.editor.lineHeightPx + commentQueueStatics.editor.verticalChromePx)}px`,
      );
      expect(proxy.getTextareaHeight()).toBe(`${String(fiveLineHeight)}px`);
    });

    it('VALID: {Shift+Enter} => inserts a newline and leaves the popover open', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: 'first' });
      await proxy.pressShiftEnter();
      await proxy.typeIntoTextarea({ text: 'second' });

      expect(proxy.getTextareaValue()).toBe('first\nsecond');
      expect(proxy.hasPopover()).toBe(true);
      expect(proxy.hasTextarea()).toBe(true);
    });

    it('EMPTY: {Enter on whitespace-only text} => queues nothing and leaves the editor open', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: '   ' });
      await proxy.pressEnter();

      expect(proxy.hasTextarea()).toBe(true);
      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(false);
    });
  });

  describe('queueing', () => {
    it('VALID: {Enter with text} => writes the entry and switches to the queued view', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: 'this step is wrong' });
      await proxy.pressEnter();

      expect(proxy.getStoredValue({ questId: QUEST_ID })).toBe(
        JSON.stringify([
          {
            flowId: 'login-flow',
            nodeId: 'login-page',
            text: 'this step is wrong',
            createdAt: proxy.queuedAt(),
          },
        ]),
      );
      expect(proxy.getQueuedText()).toBe('this step is wrong');
      expect(proxy.hasTextarea()).toBe(false);
      expect(proxy.hasEditButton()).toBe(true);
      expect(proxy.hasDeleteButton()).toBe(true);
    });

    it('VALID: {Queue button with text} => writes the same entry Enter would', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: 'queued by button' });
      await proxy.clickQueue();

      expect(proxy.getQueuedText()).toBe('queued by button');
    });

    it('VALID: {queue on an observable card} => the stored entry carries observableId', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: (
          <CommentPopoverWidget
            questId={QUEST_ID}
            flowId={FLOW_ID}
            nodeId={NODE_ID}
            observableId={OBSERVABLE_ID}
          />
        ),
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: 'this assertion is wrong' });
      await proxy.pressEnter();

      expect(proxy.getStoredValue({ questId: QUEST_ID })).toBe(
        JSON.stringify([
          {
            flowId: 'login-flow',
            nodeId: 'login-page',
            observableId: 'login-redirects-to-dashboard',
            text: 'this assertion is wrong',
            createdAt: proxy.queuedAt(),
          },
        ]),
      );
    });

    it('VALID: {text with surrounding whitespace} => stores the trimmed text', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: '  padded  ' });
      await proxy.pressEnter();

      expect(proxy.getQueuedText()).toBe('padded');
    });
  });

  describe('queued view', () => {
    it('VALID: {reopen a box with a queued comment} => shows the queued text, not an empty textarea', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: 'already queued' })],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();

      expect(proxy.getQueuedText()).toBe('already queued');
      expect(proxy.hasTextarea()).toBe(false);
    });

    it('VALID: {queued text is one unbroken token} => the queued row declares overflowWrap break-word', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: LONG_TOKEN_TEXT })],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();

      // The whole note is in the DOM either way, so this pair separates "the text is there" from
      // "the text can wrap" — the second is the only thing the fixed-width dropdown depends on.
      expect(proxy.getQueuedText()).toBe(LONG_TOKEN_TEXT);
      expect(proxy.getQueuedTextOverflowWrap()).toBe('break-word');
    });

    it('VALID: {click Edit} => reopens the editor prefilled with the queued text', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: 'already queued' })],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.clickEdit();

      expect(proxy.getTextareaValue()).toBe('already queued');
    });

    it('VALID: {click Delete} => removes the entry and closes the popover', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: 'already queued' })],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.clickDelete();

      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(false);
      expect(proxy.hasPopover()).toBe(false);
    });

    it('VALID: {edit then re-queue} => replaces the text and stamps the edit time', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [
          CommentQueueEntryStub({ text: 'first draft', createdAt: '2020-01-01T00:00:00.000Z' }),
        ],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.clickEdit();
      await proxy.typeIntoTextarea({ text: ' edited' });
      await proxy.pressEnter();

      expect(proxy.getStoredValue({ questId: QUEST_ID })).toBe(
        JSON.stringify([
          {
            flowId: 'login-flow',
            nodeId: 'login-page',
            text: 'first draft edited',
            createdAt: proxy.queuedAt(),
          },
        ]),
      );
    });
  });

  describe('bubble fill', () => {
    it('EMPTY: {box with no queued comment and the popover closed} => COMMENT_BUTTON renders the hollow bubble', () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });

      expect(proxy.commentButtonIcons()).toStrictEqual([HOLLOW_BUBBLE]);
    });

    it('VALID: {box holding a queued comment with the popover closed} => COMMENT_BUTTON renders the filled bubble', () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: 'already queued' })],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });

      expect(proxy.commentButtonIcons()).toStrictEqual([FILLED_BUBBLE]);
      expect(proxy.hasPopover()).toBe(false);
    });

    it('VALID: {popover opened on an uncommented box with an empty textarea} => COMMENT_BUTTON renders the filled bubble', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();

      // Filled the moment the popover opens, before a character is typed — the fill marks the box
      // under edit as well as the box that owes a SEND.
      expect(proxy.getTextareaValue()).toBe('');
      expect(proxy.commentButtonIcons()).toStrictEqual([FILLED_BUBBLE]);
    });

    it('VALID: {two uncommented boxes, popover opened on the first} => only the first COMMENT_BUTTON is filled', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: (
          <div>
            <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />
            <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={SECOND_NODE_ID} />
          </div>
        ),
      });
      await proxy.clickFirstCommentButton();

      expect(proxy.commentButtonIcons()).toStrictEqual([FILLED_BUBBLE, HOLLOW_BUBBLE]);
    });

    it('VALID: {queue text then close the popover} => COMMENT_BUTTON stays filled with no reload', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: 'this step is wrong' });
      await proxy.clickQueue();
      await proxy.clickCommentButton();

      // The popover is shut and nothing re-mounted — the fill is read back from the stored queue.
      expect(proxy.hasPopover()).toBe(false);
      expect(proxy.commentButtonIcons()).toStrictEqual([FILLED_BUBBLE]);
    });

    it('VALID: {type text then Cancel without queueing} => COMMENT_BUTTON returns to the hollow bubble', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: 'abandoned text' });
      await proxy.clickCancel();

      // Nothing was stored, so there is nothing to mark — a filled bubble here would claim a SEND
      // is owed for a comment that does not exist.
      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(false);
      expect(proxy.commentButtonIcons()).toStrictEqual([HOLLOW_BUBBLE]);
    });

    it('VALID: {delete the queued comment} => COMMENT_BUTTON returns to the hollow bubble', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: 'already queued' })],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.clickDelete();

      expect(proxy.commentButtonIcons()).toStrictEqual([HOLLOW_BUBBLE]);
    });

    it('VALID: {observable card holding a queued comment} => its COMMENT_BUTTON renders the filled bubble', () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [
          CommentQueueEntryStub({ observableId: OBSERVABLE_ID, text: 'this assertion is wrong' }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <CommentPopoverWidget
            questId={QUEST_ID}
            flowId={FLOW_ID}
            nodeId={NODE_ID}
            observableId={OBSERVABLE_ID}
          />
        ),
      });

      expect(proxy.commentButtonIcons()).toStrictEqual([FILLED_BUBBLE]);
    });

    it('EMPTY: {observable card whose queued comment belongs to its parent node} => its COMMENT_BUTTON stays hollow', () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: 'a note on the node, not the assertion' })],
      });

      mantineRenderAdapter({
        ui: (
          <CommentPopoverWidget
            questId={QUEST_ID}
            flowId={FLOW_ID}
            nodeId={NODE_ID}
            observableId={OBSERVABLE_ID}
          />
        ),
      });

      // The node-card entry carries no observableId, so it anchors a DIFFERENT box — the assertion
      // card must not borrow its parent's fill.
      expect(proxy.commentButtonIcons()).toStrictEqual([HOLLOW_BUBBLE]);
    });
  });

  describe('bubble presentation', () => {
    it('VALID: {rendered on a box} => the bubble row declares flex-end so the bubble sits at the box right edge', () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });

      expect(proxy.commentButtonAlignment()).toBe('flex-end');
    });

    it('VALID: {rendered on a box} => the bubble carries the shared small size and the default brown treatment', () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });

      // The bubble is one instance of the shared icon button, so its size and colours come from
      // that base rather than from props hand-tuned on this widget.
      expect(proxy.commentButtonSize()).toBe(`var(--ai-size-${iconButtonStatics.sizes.small})`);
      expect(proxy.commentButtonBackground()).toBe('rgb(42, 26, 20)');
      expect(proxy.commentButtonForeground()).toBe('rgb(224, 207, 192)');
    });
  });

  describe('cancel', () => {
    it('VALID: {cancel with nothing previously queued} => closes the popover and stores nothing', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.typeIntoTextarea({ text: 'abandoned text' });
      await proxy.clickCancel();

      expect(proxy.hasPopover()).toBe(false);
      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(false);
    });

    it('VALID: {cancel an edit of a queued comment} => restores the original queued text', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ text: 'original text' })],
      });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.clickEdit();
      await proxy.typeIntoTextarea({ text: ' plus edits' });
      await proxy.clickCancel();

      expect(proxy.getQueuedText()).toBe('original text');
      expect(proxy.hasTextarea()).toBe(false);
    });

    it('VALID: {cancel an edit} => leaves the stored entry byte-identical including createdAt', async () => {
      const proxy = CommentPopoverWidgetProxy();
      proxy.setupEmptyQueue();
      const entries = [
        CommentQueueEntryStub({ text: 'original text', createdAt: '2020-01-01T00:00:00.000Z' }),
      ];
      proxy.setupQueuedComments({ questId: QUEST_ID, entries });

      mantineRenderAdapter({
        ui: <CommentPopoverWidget questId={QUEST_ID} flowId={FLOW_ID} nodeId={NODE_ID} />,
      });
      await proxy.clickCommentButton();
      await proxy.clickEdit();
      await proxy.typeIntoTextarea({ text: ' plus edits' });
      await proxy.clickCancel();

      // Cancel writes nothing, so createdAt keeps its original value — cancel cannot rescue an
      // entry from the 7 day sweep the way a real edit does.
      expect(proxy.getStoredValue({ questId: QUEST_ID })).toBe(JSON.stringify(entries));
    });
  });
});
