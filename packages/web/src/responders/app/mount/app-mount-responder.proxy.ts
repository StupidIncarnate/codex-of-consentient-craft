import { reactDomMountAdapterProxy } from '../../../adapters/react-dom/mount/react-dom-mount-adapter.proxy';
import { AppRootWidgetProxy } from '../../../widgets/app-root/app-root-widget.proxy';
import { AppMountResponder } from './app-mount-responder';

export const AppMountResponderProxy = (): {
  callResponder: typeof AppMountResponder;
  setupRootElement: () => void;
  renderWasCalled: () => boolean;
} => {
  const adapterProxy = reactDomMountAdapterProxy();
  AppRootWidgetProxy();

  return {
    callResponder: AppMountResponder,

    setupRootElement: (): void => {
      const rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);
    },

    renderWasCalled: adapterProxy.renderWasCalled,
  };
};
