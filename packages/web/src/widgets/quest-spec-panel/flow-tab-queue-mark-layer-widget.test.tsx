import { FlowIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

import { FlowTabQueueMarkLayerWidget } from './flow-tab-queue-mark-layer-widget';
import { FlowTabQueueMarkLayerWidgetProxy } from './flow-tab-queue-mark-layer-widget.proxy';

const QUEST_ID = QuestIdStub({ value: 'quest-a' });
const FLOW_ID = FlowIdStub({ value: 'login-flow' });
// The tabler component name the icon mock stamps as the rendered glyph's testid. Filled is the
// whole signal: the hollow bubble is what a box with nothing owed already paints.
const FILLED_BUBBLE = 'IconMessageCircleFilled';

describe('FlowTabQueueMarkLayerWidget', () => {
  it('VALID: {a comment queued on this flow} => renders one mark painting the filled bubble', () => {
    const proxy = FlowTabQueueMarkLayerWidgetProxy();
    proxy.setupEmptyQueue();
    proxy.setupQueuedComments({
      questId: QUEST_ID,
      entries: [CommentQueueEntryStub({ flowId: 'login-flow', nodeId: 'login-page' })],
    });

    mantineRenderAdapter({
      ui: <FlowTabQueueMarkLayerWidget questId={QUEST_ID} flowId={FLOW_ID} />,
    });

    expect(proxy.countMarks()).toBe(1);
    expect(proxy.markGlyphs()).toStrictEqual([FILLED_BUBBLE]);
  });

  it('EMPTY: {queue holds nothing} => renders no mark', () => {
    const proxy = FlowTabQueueMarkLayerWidgetProxy();
    proxy.setupEmptyQueue();

    mantineRenderAdapter({
      ui: <FlowTabQueueMarkLayerWidget questId={QUEST_ID} flowId={FLOW_ID} />,
    });

    expect(proxy.countMarks()).toBe(0);
    expect(proxy.markGlyphs()).toStrictEqual([]);
  });

  // The queue is one array per QUEST, holding every flow's comments together — so a mark that
  // read the array's length rather than its flowIds would light up every tab as soon as any one
  // box was commented on.
  it('VALID: {the only queued comment belongs to another flow} => renders no mark', () => {
    const proxy = FlowTabQueueMarkLayerWidgetProxy();
    proxy.setupEmptyQueue();
    proxy.setupQueuedComments({
      questId: QUEST_ID,
      entries: [CommentQueueEntryStub({ flowId: 'checkout-flow', nodeId: 'cart-page' })],
    });

    mantineRenderAdapter({
      ui: <FlowTabQueueMarkLayerWidget questId={QUEST_ID} flowId={FLOW_ID} />,
    });

    expect(proxy.countMarks()).toBe(0);
    expect(proxy.markGlyphs()).toStrictEqual([]);
  });

  // The mark says "this flow owes a SEND", not how much it owes — the queue bar carries the count.
  it('VALID: {three boxes of this flow queued} => still renders exactly one mark', () => {
    const proxy = FlowTabQueueMarkLayerWidgetProxy();
    proxy.setupEmptyQueue();
    proxy.setupQueuedComments({
      questId: QUEST_ID,
      entries: [
        CommentQueueEntryStub({ flowId: 'login-flow', nodeId: 'login-page' }),
        CommentQueueEntryStub({ flowId: 'login-flow', nodeId: 'login-submit' }),
        CommentQueueEntryStub({ flowId: 'checkout-flow', nodeId: 'cart-page' }),
      ],
    });

    mantineRenderAdapter({
      ui: <FlowTabQueueMarkLayerWidget questId={QUEST_ID} flowId={FLOW_ID} />,
    });

    expect(proxy.countMarks()).toBe(1);
    expect(proxy.markGlyphs()).toStrictEqual([FILLED_BUBBLE]);
  });

  // An inactive tab's own text is dim; a mark inheriting that dim is the one a reader scanning the
  // tab row for unsent work does not see.
  it('VALID: {mark rendered} => paints in the primary theme colour rather than inheriting the tab text', () => {
    const proxy = FlowTabQueueMarkLayerWidgetProxy();
    proxy.setupEmptyQueue();
    proxy.setupQueuedComments({
      questId: QUEST_ID,
      entries: [CommentQueueEntryStub({ flowId: 'login-flow', nodeId: 'login-page' })],
    });

    mantineRenderAdapter({
      ui: <FlowTabQueueMarkLayerWidget questId={QUEST_ID} flowId={FLOW_ID} />,
    });

    expect(proxy.markColor()).toBe('rgb(255, 107, 53)');
    expect(emberDepthsThemeStatics.colors.primary).toBe('#ff6b35');
  });
});
