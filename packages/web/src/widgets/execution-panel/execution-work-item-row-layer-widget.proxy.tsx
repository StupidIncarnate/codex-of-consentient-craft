import { ExecutionRowLayerWidgetProxy } from './execution-row-layer-widget.proxy';

export const ExecutionWorkItemRowLayerWidgetProxy = (): {
  setupWardDetailNotFound: () => void;
  setupRiftcarverDetailNotFound: () => void;
} => {
  const rowProxy = ExecutionRowLayerWidgetProxy();

  return {
    setupWardDetailNotFound: (): void => {
      rowProxy.setupWardDetailNotFound();
    },
    setupRiftcarverDetailNotFound: (): void => {
      rowProxy.setupRiftcarverDetailNotFound();
    },
  };
};
