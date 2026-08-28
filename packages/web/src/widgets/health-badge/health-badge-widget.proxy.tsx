/**
 * PURPOSE: Test proxy for HealthBadgeWidget — delegates to the binding proxy for seed, heartbeat,
 * channel and silence-clock setup, and exposes UI selectors for the badge's rendered text, its
 * title attribute and its click.
 *
 * USAGE:
 * const proxy = HealthBadgeWidgetProxy();
 * proxy.setupOnlineSeed({ uptimeSeconds: 11520 });
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { useHealthStatusBindingProxy } from '../../bindings/use-health-status/use-health-status-binding.proxy';
import { healthBadgeStatics } from '../../statics/health-badge/health-badge-statics';

type HealthStatusPayload = ReturnType<typeof HealthStatusPayloadStub>;

export const HealthBadgeWidgetProxy = (): {
  setupOnlineSeed: (params: { uptimeSeconds: number }) => void;
  setupDegradedSeed: () => void;
  setupServerError: () => void;
  setupUnreachable: () => void;
  setupConnectedChannel: () => void;
  deliverHeartbeat: (params: { payload: HealthStatusPayload }) => void;
  installSilenceClock: () => void;
  restoreRealClock: () => void;
  getRequestCount: () => RequestCount;
  hasBadgeText: (params: { text: string }) => boolean;
  hasBadgeTitle: (params: { text: string }) => boolean;
  isBadgeEnabled: () => boolean;
  clickBadge: () => Promise<void>;
} => {
  const binding = useHealthStatusBindingProxy();

  return {
    setupOnlineSeed: ({ uptimeSeconds }: { uptimeSeconds: number }): void => {
      binding.setupSeed({ payload: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds }) });
    },
    setupDegradedSeed: (): void => {
      binding.setupSeed({ payload: HealthStatusPayloadStub({ status: 'degraded' }) });
    },
    setupServerError: (): void => {
      binding.setupServerError();
    },
    setupUnreachable: (): void => {
      binding.setupUnreachable();
    },
    setupConnectedChannel: (): void => {
      binding.setupConnectedChannel();
    },
    deliverHeartbeat: ({ payload }: { payload: HealthStatusPayload }): void => {
      binding.deliverHeartbeat({ payload });
    },
    installSilenceClock: (): void => {
      binding.installSilenceClock();
    },
    restoreRealClock: (): void => {
      binding.restoreRealClock();
    },
    getRequestCount: (): RequestCount => binding.getRequestCount(),
    hasBadgeText: ({ text }: { text: string }): boolean =>
      screen.queryByTestId(healthBadgeStatics.testId)?.textContent === text,
    hasBadgeTitle: ({ text }: { text: string }): boolean =>
      screen.queryByTestId(healthBadgeStatics.testId)?.getAttribute('title') === text,
    isBadgeEnabled: (): boolean => {
      const element = screen.queryByTestId(healthBadgeStatics.testId);
      return element instanceof HTMLButtonElement && !element.disabled;
    },
    clickBadge: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId(healthBadgeStatics.testId));
    },
  };
};
