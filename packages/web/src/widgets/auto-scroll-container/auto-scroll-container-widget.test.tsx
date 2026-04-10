import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { TestIdStub } from '../../contracts/test-id/test-id.stub';
import { AutoScrollContainerWidget } from './auto-scroll-container-widget';
import { AutoScrollContainerWidgetProxy } from './auto-scroll-container-widget.proxy';

describe('AutoScrollContainerWidget', () => {
  describe('rendering', () => {
    it('VALID: {children: text} => renders children inside scroll container', () => {
      AutoScrollContainerWidgetProxy();
      const testId = TestIdStub({ value: 'scroll-area' });

      mantineRenderAdapter({
        ui: (
          <AutoScrollContainerWidget testId={testId}>
            <span data-testid="child">child content</span>
          </AutoScrollContainerWidget>
        ),
      });

      expect(screen.getByTestId('child').textContent).toBe('child content');
    });

    it('VALID: {testId: "scroll-area"} => renders data-testid on scroll container', () => {
      const proxy = AutoScrollContainerWidgetProxy();
      const testId = TestIdStub({ value: 'scroll-area' });

      mantineRenderAdapter({
        ui: (
          <AutoScrollContainerWidget testId={testId}>
            <span>child</span>
          </AutoScrollContainerWidget>
        ),
      });

      expect(proxy.isVisible({ testId: 'scroll-area' })).toBe(true);
    });

    it('VALID: {no testId} => renders scroll container without data-testid', () => {
      AutoScrollContainerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <AutoScrollContainerWidget>
            <span data-testid="child">child</span>
          </AutoScrollContainerWidget>
        ),
      });

      expect(screen.getByTestId('child').textContent).toBe('child');
    });
  });
});
