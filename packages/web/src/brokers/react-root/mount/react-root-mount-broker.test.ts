import { document } from '#gateway/browser/document';
import { createElement } from '#gateway/npm/react';
import type { ReactNode } from '#gateway/npm/react';
import { act, screen } from '#gateway/npm/testing-library__react';

import { reactRootMountBroker } from './react-root-mount-broker';
import { reactRootMountBrokerProxy } from './react-root-mount-broker.proxy';

const TestWrapper = ({ children }: { children: ReactNode }): React.JSX.Element =>
  createElement('div', { 'data-testid': 'WRAPPER' }, children);

describe('reactRootMountBroker', () => {
  describe('successful mount', () => {
    it('VALID: {rootElementId, Wrapper, content} => renders content inside the wrapper in that element', async () => {
      reactRootMountBrokerProxy();
      const rootElement = document.createElement('div');
      rootElement.id = 'test-root';
      document.body.appendChild(rootElement);

      act(() => {
        reactRootMountBroker({
          rootElementId: 'test-root',
          Wrapper: TestWrapper,
          content: createElement('span', { 'data-testid': 'CONTENT' }, 'Hello'),
        });
      });

      const content = await screen.findByTestId('CONTENT');
      const wrapper = screen.getByTestId('WRAPPER');
      const wrapperContainsContent = wrapper.contains(content);
      const rootContainsWrapper = rootElement.contains(wrapper);
      document.body.removeChild(rootElement);

      expect(content.textContent).toBe('Hello');
      expect(wrapperContainsContent).toBe(true);
      expect(rootContainsWrapper).toBe(true);
    });
  });

  describe('error cases', () => {
    it('ERROR: {rootElementId: "nonexistent"} => throws when element not found', () => {
      reactRootMountBrokerProxy();

      expect(() => {
        reactRootMountBroker({
          rootElementId: 'nonexistent',
          Wrapper: TestWrapper,
          content: createElement('span', null, 'Hello'),
        });
      }).toThrow(/^Root element not found: nonexistent$/u);
    });
  });
});
