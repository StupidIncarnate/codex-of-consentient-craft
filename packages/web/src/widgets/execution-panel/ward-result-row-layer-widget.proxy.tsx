import type { RequestCount } from '@dungeonmaster/testing';

import { WardResultDetailLayerWidgetProxy } from './ward-result-detail-layer-widget.proxy';

export const WardResultRowLayerWidgetProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getDetailRequestCount: () => RequestCount;
} => {
  const detailProxy = WardResultDetailLayerWidgetProxy();

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
