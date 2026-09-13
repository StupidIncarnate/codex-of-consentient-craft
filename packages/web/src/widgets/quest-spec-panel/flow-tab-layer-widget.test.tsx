import { screen } from '@testing-library/react';

import { ArrayIndexStub, FlowStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { FlowTabLayerWidget } from './flow-tab-layer-widget';
import { FlowTabLayerWidgetProxy } from './flow-tab-layer-widget.proxy';

type Flow = ReturnType<typeof FlowStub>;

const QUEST_ID = QuestIdStub({ value: 'quest-a' });
// The tabler component name the icon mock stamps as the rendered glyph's testid — the whole
// jsdom-visible difference between the filled bubble this mark paints and the hollow one a box
// with nothing owed already paints.
const FILLED_BUBBLE = 'IconMessageCircleFilled';

// FlowStub calls flowContract.parse(), which enforces min(1) on name, so the empty-name case (the
// fallback label this widget owns) is applied after the stub call via Object.assign — same shape
// flows-layer-widget.test.tsx uses for the same reason.
const EmptyNameFlowStub = ({ id }: { id: string }): Flow =>
  Object.assign(FlowStub({ id: id as never }), { name: '' }) as Flow;

describe('FlowTabLayerWidget', () => {
  it('VALID: {flow with a short name} => renders the full name as the tab label', () => {
    FlowTabLayerWidgetProxy();
    const flow = FlowStub({ name: 'Login Flow' });

    mantineRenderAdapter({
      ui: (
        <FlowTabLayerWidget
          flow={flow}
          index={ArrayIndexStub({ value: 0 })}
          isActive={false}
          onSelect={() => undefined}
        />
      ),
    });

    expect(screen.getByTestId('FLOW_TAB_LABEL').textContent).toBe('Login Flow');
  });

  it('EDGE: {flow with an empty name, index: 2} => tab label falls back to "Flow 3"', () => {
    FlowTabLayerWidgetProxy();
    const flow = EmptyNameFlowStub({ id: 'flow-c' });

    mantineRenderAdapter({
      ui: (
        <FlowTabLayerWidget
          flow={flow}
          index={ArrayIndexStub({ value: 2 })}
          isActive={false}
          onSelect={() => undefined}
        />
      ),
    });

    expect(screen.getByTestId('FLOW_TAB_LABEL').textContent).toBe('Flow 3');
  });

  it('VALID: {flow with a name over 28 chars} => the label truncates with an ellipsis', () => {
    FlowTabLayerWidgetProxy();
    const flow = FlowStub({ name: 'A'.repeat(30) });

    mantineRenderAdapter({
      ui: (
        <FlowTabLayerWidget
          flow={flow}
          index={ArrayIndexStub({ value: 0 })}
          isActive={false}
          onSelect={() => undefined}
        />
      ),
    });

    expect(screen.getByTestId('FLOW_TAB_LABEL').textContent).toBe(`${'A'.repeat(27)}…`);
  });

  it('VALID: {flow with a long name} => the tab title carries the untruncated name', () => {
    FlowTabLayerWidgetProxy();
    const longName = 'B'.repeat(30);
    const flow = FlowStub({ name: longName });

    mantineRenderAdapter({
      ui: (
        <FlowTabLayerWidget
          flow={flow}
          index={ArrayIndexStub({ value: 0 })}
          isActive={false}
          onSelect={() => undefined}
        />
      ),
    });

    expect(screen.getByTestId('FLOW_TAB').getAttribute('title')).toBe(longName);
  });

  it('VALID: {isActive: true} => the tab carries data-active="true"', () => {
    FlowTabLayerWidgetProxy();
    const flow = FlowStub();

    mantineRenderAdapter({
      ui: (
        <FlowTabLayerWidget
          flow={flow}
          index={ArrayIndexStub({ value: 0 })}
          isActive={true}
          onSelect={() => undefined}
        />
      ),
    });

    expect(screen.getByTestId('FLOW_TAB').getAttribute('data-active')).toBe('true');
  });

  it('VALID: {isActive: false} => the tab carries no data-active attribute', () => {
    FlowTabLayerWidgetProxy();
    const flow = FlowStub();

    mantineRenderAdapter({
      ui: (
        <FlowTabLayerWidget
          flow={flow}
          index={ArrayIndexStub({ value: 0 })}
          isActive={false}
          onSelect={() => undefined}
        />
      ),
    });

    expect(screen.getByTestId('FLOW_TAB').getAttribute('data-active')).toBe(null);
  });

  it('VALID: {the tab is clicked} => calls onSelect once', async () => {
    const proxy = FlowTabLayerWidgetProxy();
    const flow = FlowStub();
    const onSelect = jest.fn();

    mantineRenderAdapter({
      ui: (
        <FlowTabLayerWidget
          flow={flow}
          index={ArrayIndexStub({ value: 0 })}
          isActive={false}
          onSelect={onSelect}
        />
      ),
    });
    await proxy.clickTab();

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  describe('queued-comment mark', () => {
    it('VALID: {commentQuestId set, a comment queued on this flow} => renders the queue mark', () => {
      const proxy = FlowTabLayerWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ flowId: 'login-flow', nodeId: 'login-page' })],
      });
      const flow = FlowStub({ id: 'login-flow' as never });

      mantineRenderAdapter({
        ui: (
          <FlowTabLayerWidget
            flow={flow}
            index={ArrayIndexStub({ value: 0 })}
            isActive={false}
            onSelect={() => undefined}
            commentQuestId={QUEST_ID}
          />
        ),
      });

      expect(proxy.countMarks()).toBe(1);
      expect(proxy.markGlyphs()).toStrictEqual([FILLED_BUBBLE]);
    });

    it('EMPTY: {commentQuestId absent, a comment queued on this flow} => renders no queue mark', () => {
      const proxy = FlowTabLayerWidgetProxy();
      proxy.setupEmptyQueue();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [CommentQueueEntryStub({ flowId: 'login-flow', nodeId: 'login-page' })],
      });
      const flow = FlowStub({ id: 'login-flow' as never });

      mantineRenderAdapter({
        ui: (
          <FlowTabLayerWidget
            flow={flow}
            index={ArrayIndexStub({ value: 0 })}
            isActive={false}
            onSelect={() => undefined}
          />
        ),
      });

      expect(proxy.countMarks()).toBe(0);
      expect(proxy.markGlyphs()).toStrictEqual([]);
    });

    it('EMPTY: {commentQuestId set, no comment queued on this flow} => renders no queue mark', () => {
      const proxy = FlowTabLayerWidgetProxy();
      proxy.setupEmptyQueue();
      const flow = FlowStub({ id: 'login-flow' as never });

      mantineRenderAdapter({
        ui: (
          <FlowTabLayerWidget
            flow={flow}
            index={ArrayIndexStub({ value: 0 })}
            isActive={false}
            onSelect={() => undefined}
            commentQuestId={QUEST_ID}
          />
        ),
      });

      expect(proxy.countMarks()).toBe(0);
      expect(proxy.markGlyphs()).toStrictEqual([]);
    });
  });
});
