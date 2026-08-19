import type { RequestCount } from '@dungeonmaster/testing';
import type { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { useHealthBindingProxy } from '../../bindings/use-health/use-health-binding.proxy';
import { PixelSpriteWidgetProxy } from '../pixel-sprite/pixel-sprite-widget.proxy';

type HealthSnapshot = ReturnType<typeof HealthSnapshotStub>;

export const ServerHealthBadgeWidgetProxy = (): {
  setupSnapshot: (params: { snapshot: HealthSnapshot }) => void;
  setupInvalidBody: () => void;
  setupNetworkError: () => void;
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  closeChannel: () => void;
  getRequestCount: () => RequestCount;
} => {
  PixelSpriteWidgetProxy();
  const bindingProxy = useHealthBindingProxy();

  return {
    setupSnapshot: bindingProxy.setupSnapshot,
    setupInvalidBody: bindingProxy.setupInvalidBody,
    setupNetworkError: bindingProxy.setupNetworkError,
    setupConnectedChannel: (): void => {
      bindingProxy.setupConnectedChannel();
    },
    deliverWsMessage: ({ data }: { data: string }): void => {
      bindingProxy.deliverWsMessage({ data });
    },
    closeChannel: (): void => {
      bindingProxy.closeChannel();
    },
    getRequestCount: bindingProxy.getRequestCount,
  };
};
