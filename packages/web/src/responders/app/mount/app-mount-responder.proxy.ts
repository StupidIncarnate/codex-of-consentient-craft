import { document } from '#gateway/browser/document';
import { screen } from '#gateway/npm/testing-library__react';

import { reactRootMountBrokerProxy } from '../../../brokers/react-root/mount/react-root-mount-broker.proxy';
import { AppRootWidgetProxy } from '../../../widgets/app-root/app-root-widget.proxy';
import { AppMountResponder } from './app-mount-responder';

export const AppMountResponderProxy = (): {
  callResponder: typeof AppMountResponder;
  setupRootElement: () => void;
  isMountedInsideAppRoot: () => boolean;
} => {
  reactRootMountBrokerProxy();
  AppRootWidgetProxy();

  return {
    callResponder: AppMountResponder,

    setupRootElement: (): void => {
      const rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);
    },

    isMountedInsideAppRoot: (): boolean =>
      screen.queryByTestId('APP_ROOT_BG')?.textContent === 'test-content',
  };
};
