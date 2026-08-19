import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { TailStartIndexStub } from '../../contracts/tail-start-index/tail-start-index.stub';
import { ToggleTestIdStub } from '../../contracts/toggle-test-id/toggle-test-id.stub';
import { ShowEarlierToggleWidget } from './show-earlier-toggle-widget';
import { ShowEarlierToggleWidgetProxy } from './show-earlier-toggle-widget.proxy';

describe('ShowEarlierToggleWidget', () => {
  describe('label rendering', () => {
    it('VALID: {hiddenCount: 1, expanded: false} => shows "▸ Show 1 earlier entry"', () => {
      ShowEarlierToggleWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ShowEarlierToggleWidget
            hiddenCount={TailStartIndexStub({ value: 1 })}
            expanded={false}
            onToggle={(): void => undefined}
            testId={ToggleTestIdStub()}
          />
        ),
      });

      const node = screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE');

      expect(node.textContent).toBe('▸ Show 1 earlier entry');
    });

    it('VALID: {hiddenCount: 5, expanded: false} => shows "▸ Show 5 earlier entries"', () => {
      ShowEarlierToggleWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ShowEarlierToggleWidget
            hiddenCount={TailStartIndexStub({ value: 5 })}
            expanded={false}
            onToggle={(): void => undefined}
            testId={ToggleTestIdStub({ value: 'CHAT_LIST_SHOW_EARLIER_TOGGLE' })}
          />
        ),
      });

      const node = screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE');

      expect(node.textContent).toBe('▸ Show 5 earlier entries');
    });

    it('VALID: {hiddenCount: 5, expanded: true} => shows "▾ Hide 5 earlier entries"', () => {
      ShowEarlierToggleWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ShowEarlierToggleWidget
            hiddenCount={TailStartIndexStub({ value: 5 })}
            expanded={true}
            onToggle={(): void => undefined}
            testId={ToggleTestIdStub()}
          />
        ),
      });

      const node = screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE');

      expect(node.textContent).toBe('▾ Hide 5 earlier entries');
    });

    it('VALID: {hiddenCount: 1, expanded: true} => shows "▾ Hide 1 earlier entry"', () => {
      ShowEarlierToggleWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ShowEarlierToggleWidget
            hiddenCount={TailStartIndexStub({ value: 1 })}
            expanded={true}
            onToggle={(): void => undefined}
            testId={ToggleTestIdStub()}
          />
        ),
      });

      const node = screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE');

      expect(node.textContent).toBe('▾ Hide 1 earlier entry');
    });
  });

  describe('click handling', () => {
    it('VALID: {click toggle} => calls onToggle once', async () => {
      ShowEarlierToggleWidgetProxy();
      const onToggle = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ShowEarlierToggleWidget
            hiddenCount={TailStartIndexStub({ value: 3 })}
            expanded={false}
            onToggle={onToggle}
            testId={ToggleTestIdStub()}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE'));

      expect(onToggle.mock.calls).toStrictEqual([[]]);
    });

    // Revealing earlier entries grows the transcript, and the auto-scroll's ResizeObserver reads
    // that growth as new output and jumps to the bottom — which is what left the reader at the end
    // of the chain instead of at the entries they just asked to see. The hold is what stops it.
    // jsdom has no layout, so this is the half of the fix it can observe; the scroll arithmetic
    // itself is covered by compute-anchor-scroll-top-transformer.test.ts.
    it('VALID: {click toggle} => puts the auto-scroll on hold', async () => {
      const proxy = ShowEarlierToggleWidgetProxy();
      proxy.setupAutoScrollReleased();

      mantineRenderAdapter({
        ui: (
          <ShowEarlierToggleWidget
            hiddenCount={TailStartIndexStub({ value: 3 })}
            expanded={false}
            onToggle={(): void => undefined}
            testId={ToggleTestIdStub()}
          />
        ),
      });

      expect(proxy.isAutoScrollHeld()).toBe(false);

      await userEvent.click(screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE'));

      expect(proxy.isAutoScrollHeld()).toBe(true);
    });
  });
});
