import { screen } from '@testing-library/react';
import type { RequestCount } from '@dungeonmaster/testing';
import type { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';
import { healthSnapshotContract } from '@dungeonmaster/shared/contracts';

import { useHealthBindingProxy } from '../../bindings/use-health/use-health-binding.proxy';
import { HealthErrorLayerWidgetProxy } from './health-error-layer-widget.proxy';
import { HealthTableLayerWidgetProxy } from './health-table-layer-widget.proxy';

type HealthSnapshot = ReturnType<typeof HealthSnapshotStub>;

export const HealthPageWidgetProxy = (): {
  hasHealthPage: () => boolean;
  getTitleText: () => HTMLElement['textContent'];
  setupSnapshot: (params: { snapshot: HealthSnapshot }) => void;
  setupInvalidBody: () => void;
  setupServerError: () => void;
  setupNetworkError: () => void;
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  closeChannel: () => void;
  getRequestCount: () => RequestCount;
  hasTable: () => boolean;
  hasErrorPanel: () => boolean;
  isLoadingVisible: () => boolean;
  getUptimeValue: () => HealthSnapshot['uptimeSeconds'];
  getErrorStatusText: () => HTMLElement['textContent'];
  clickRetry: () => Promise<void>;
} => {
  const bindingProxy = useHealthBindingProxy();
  const tableProxy = HealthTableLayerWidgetProxy();
  const errorProxy = HealthErrorLayerWidgetProxy();

  return {
    hasHealthPage: (): boolean => screen.queryByTestId('HEALTH_PAGE') !== null,
    getTitleText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HEALTH_PAGE_TITLE')?.textContent ?? null,
    setupSnapshot: bindingProxy.setupSnapshot,
    setupInvalidBody: bindingProxy.setupInvalidBody,
    setupServerError: bindingProxy.setupServerError,
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
    hasTable: (): boolean => screen.queryByTestId('HEALTH_PAGE_TABLE') !== null,
    hasErrorPanel: (): boolean => screen.queryByTestId('HEALTH_PAGE_ERROR') !== null,
    isLoadingVisible: (): boolean => screen.queryByTestId('HEALTH_PAGE_LOADING') !== null,
    getUptimeValue: (): HealthSnapshot['uptimeSeconds'] =>
      healthSnapshotContract.shape.uptimeSeconds.parse(
        Number(tableProxy.getValueText({ valueTestId: 'HEALTH_PAGE_VALUE_UPTIME_SECONDS' })),
      ),
    getErrorStatusText: (): HTMLElement['textContent'] => errorProxy.getStatusText(),
    clickRetry: async (): Promise<void> => errorProxy.clickRetry(),
  };
};
