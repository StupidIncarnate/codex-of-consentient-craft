import { createElement } from 'react';

import { reactDomMountAdapter } from './react-dom-mount-adapter';
import { reactDomMountAdapterProxy } from './react-dom-mount-adapter.proxy';

const TestWrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element =>
  createElement('div', { 'data-testid': 'WRAPPER' }, children);

describe('reactDomMountAdapter', () => {
  describe('successful mount', () => {
    it('VALID: {rootElementId, Wrapper, content} => calls createRoot and render', () => {
      const proxy = reactDomMountAdapterProxy();
      const rootElement = document.createElement('div');
      rootElement.id = 'test-root';
      document.body.appendChild(rootElement);

      reactDomMountAdapter({
        rootElementId: 'test-root',
        Wrapper: TestWrapper,
        content: createElement('span', null, 'Hello'),
      });

      document.body.removeChild(rootElement);

      expect(proxy.renderWasCalled()).toBe(true);
    });
  });

  describe('error cases', () => {
    it('ERROR: {rootElementId: "missing"} => throws when element not found', () => {
      reactDomMountAdapterProxy();

      expect(() => {
        reactDomMountAdapter({
          rootElementId: 'nonexistent',
          Wrapper: TestWrapper,
          content: createElement('span', null, 'Hello'),
        });
      }).toThrow('Root element not found: nonexistent');
    });
  });
});
