
import { RiftcarverResultDetailLayerWidgetProxy } from './riftcarver-result-detail-layer-widget.proxy';

export const RiftcarverResultRowLayerWidgetProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getDetailRequestCount: () => number;
} => {
  const detailProxy = RiftcarverResultDetailLayerWidgetProxy();

  return {
    setupDetail: ({ detail }: { detail: unknown }): void => {
      detailProxy.setupDetail({ detail });
    },
    setupNotFound: (): void => {
      detailProxy.setupNotFound();
    },
    getDetailRequestCount: (): number => detailProxy.getRequestCount(),
  };
};
