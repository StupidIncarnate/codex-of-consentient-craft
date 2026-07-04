/**
 * PURPOSE: Test proxy for DispatchToggleWidget - sets up dispatch state, play/pause endpoints,
 * and toast capture, and exposes UI triggers/selectors for the toggle button.
 *
 * USAGE:
 * const proxy = DispatchToggleWidgetProxy();
 * proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { mantineNotificationsShowAdapterProxy } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter.proxy';
import { useDispatchStateBindingProxy } from '../../bindings/use-dispatch-state/use-dispatch-state-binding.proxy';
import { orchestrationDispatchPauseBrokerProxy } from '../../brokers/orchestration/dispatch-pause/orchestration-dispatch-pause-broker.proxy';
import { orchestrationDispatchPlayBrokerProxy } from '../../brokers/orchestration/dispatch-play/orchestration-dispatch-play-broker.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;
type PlayProxy = ReturnType<typeof orchestrationDispatchPlayBrokerProxy>;
type PauseProxy = ReturnType<typeof orchestrationDispatchPauseBrokerProxy>;

export const DispatchToggleWidgetProxy = (): {
  setupDispatchState: (params: { state: DispatchState }) => void;
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  setupPlayAllowed: (params: { state: DispatchState }) => void;
  setupPlayDenied: (params: { reason: string; state: DispatchState }) => void;
  setupPause: (params: { state: DispatchState }) => void;
  clickToggle: () => Promise<void>;
  hasToggleLabel: (params: { text: string }) => boolean;
  hasToggle: () => boolean;
  getPlayRequestCount: () => ReturnType<PlayProxy['getRequestCount']>;
  getPauseRequestCount: () => ReturnType<PauseProxy['getRequestCount']>;
  getShownToast: () => unknown;
} => {
  const binding = useDispatchStateBindingProxy();
  const play = orchestrationDispatchPlayBrokerProxy();
  const pause = orchestrationDispatchPauseBrokerProxy();
  const notifications = mantineNotificationsShowAdapterProxy();
  const pixelBtn = PixelBtnWidgetProxy();

  return {
    setupDispatchState: ({ state }: { state: DispatchState }): void => {
      binding.setupState({ state });
    },
    setupConnectedChannel: (): void => {
      binding.setupConnectedChannel();
    },
    deliverWsMessage: ({ data }: { data: string }): void => {
      binding.deliverWsMessage({ data });
    },
    setupPlayAllowed: ({ state }: { state: DispatchState }): void => {
      play.setupAllowed({ state });
    },
    setupPlayDenied: ({ reason, state }: { reason: string; state: DispatchState }): void => {
      play.setupDenied({ reason, state });
    },
    setupPause: ({ state }: { state: DispatchState }): void => {
      pause.setupState({ state });
    },
    clickToggle: async (): Promise<void> => {
      const toggle = screen.getByTestId('DISPATCH_TOGGLE');
      await userEvent.click(within(toggle).getByTestId('PIXEL_BTN'));
    },
    hasToggleLabel: ({ text }: { text: string }): boolean => pixelBtn.hasLabel({ text }),
    hasToggle: (): boolean => screen.queryByTestId('DISPATCH_TOGGLE') !== null,
    getPlayRequestCount: (): ReturnType<PlayProxy['getRequestCount']> => play.getRequestCount(),
    getPauseRequestCount: (): ReturnType<PauseProxy['getRequestCount']> => pause.getRequestCount(),
    getShownToast: (): unknown => notifications.getShownNotification(),
  };
};
