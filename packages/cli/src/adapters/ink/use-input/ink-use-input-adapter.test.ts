import { render } from 'ink-testing-library';
import React from 'react';

import { cliStatics } from '../../../statics/cli/cli-statics';
import { inkUseInputAdapter } from './ink-use-input-adapter';
import { inkUseInputAdapterProxy } from './ink-use-input-adapter.proxy';

const waitForUseEffect = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, cliStatics.testing.useEffectDelayMs);
  });
};

describe('inkUseInputAdapter', () => {
  describe('hook registration', () => {
    it('VALID: {handler} => registers keyboard handler in component', () => {
      inkUseInputAdapterProxy();
      const handler = jest.fn();

      // Create component that uses the adapter
      const TestComponent = (): React.ReactElement => {
        inkUseInputAdapter({ handler });
        return React.createElement('ink-text', null, 'test');
      };

      const { unmount } = render(React.createElement(TestComponent));
      unmount();

      // Handler is registered but not called until input
      expect(handler).not.toHaveBeenCalled();
    });

    it('VALID: {handler} => calls handler when key is pressed', async () => {
      inkUseInputAdapterProxy();
      const handler = jest.fn();

      const TestComponent = (): React.ReactElement => {
        inkUseInputAdapter({ handler });
        return React.createElement('ink-text', null, 'test');
      };

      const { stdin, unmount } = render(React.createElement(TestComponent));
      await waitForUseEffect();
      stdin.write('a');
      await waitForUseEffect();
      unmount();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        input: 'a',
        key: {
          upArrow: false,
          downArrow: false,
          leftArrow: false,
          rightArrow: false,
          pageDown: false,
          pageUp: false,
          return: false,
          escape: false,
          ctrl: false,
          shift: false,
          tab: false,
          backspace: false,
          delete: false,
          meta: false,
        },
      });
    });
  });
});
