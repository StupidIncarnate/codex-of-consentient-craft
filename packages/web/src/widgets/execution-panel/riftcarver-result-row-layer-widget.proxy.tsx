import type { RequestCount } from '@dungeonmaster/testing';

import { RiftcarverResultDetailLayerWidgetProxy } from './riftcarver-result-detail-layer-widget.proxy';

export const RiftcarverResultRowLayerWidgetProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getDetailRequestCount: () => RequestCount;
} => {
  const detailProxy = RiftcarverResultDetailLayerWidgetProxy();

  return {
    setupDetail: ({ detail }: { detail: unknown }): void => {
      detailProxy.setupDetail({ detail });
    },
    setupNotFound: (): void => {
      detailProxy.setupNotFound();
    },
    getDetailRequestCount: (): RequestCount => detailProxy.getRequestCount(),
  };
};
