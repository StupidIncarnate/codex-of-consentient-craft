import { waitFor } from '@testing-library/react';

import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { DispatchToggleWidget } from './dispatch-toggle-widget';
import { DispatchToggleWidgetProxy } from './dispatch-toggle-widget.proxy';

describe('DispatchToggleWidget', () => {
  describe('label by mode', () => {
    it('VALID: {mode: paused} => shows PLAY button', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PLAY' })).toBe(true);
    });

    it('VALID: {mode: node-playing} => shows PAUSE button', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'node-playing' }) });

      const { findByTestId } = mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
    });

    it('EMPTY: {state loading} => renders nothing before the fetch resolves', () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      expect(proxy.hasToggle()).toBe(false);
    });
  });

  describe('click PLAY', () => {
    it('VALID: {paused, allowed play} => fires POST to the play endpoint', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });
      proxy.setupPlayAllowed({ state: DispatchStateStub({ mode: 'node-playing' }) });

      const { findByTestId } = mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');
      await proxy.clickToggle();

      await waitFor(() => {
        expect(proxy.getPlayRequestCount()).toBe(1);
      });

      expect(proxy.getPlayRequestCount()).toBe(1);
      expect(proxy.getPauseRequestCount()).toBe(0);
    });

    it('VALID: {paused, 409 denial} => shows the denial reason as a red toast', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });
      proxy.setupPlayDenied({
        reason: 'A /dumpster-launch loop owns the queue',
        state: DispatchStateStub({ mode: 'paused' }),
      });

      const { findByTestId } = mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');
      await proxy.clickToggle();

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: 'A /dumpster-launch loop owns the queue',
          color: 'red',
        });
      });

      expect(proxy.getShownToast()).toStrictEqual({
        message: 'A /dumpster-launch loop owns the queue',
        color: 'red',
      });
    });

    it('VALID: {paused, allowed play} => shows no toast', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });
      proxy.setupPlayAllowed({ state: DispatchStateStub({ mode: 'node-playing' }) });

      const { findByTestId } = mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');
      await proxy.clickToggle();

      await waitFor(() => {
        expect(proxy.getPlayRequestCount()).toBe(1);
      });

      expect(proxy.getShownToast()).toBe(undefined);
    });
  });

  describe('click PAUSE', () => {
    it('VALID: {node-playing} => fires POST to the pause endpoint', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'node-playing' }) });
      proxy.setupPause({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');
      await proxy.clickToggle();

      await waitFor(() => {
        expect(proxy.getPauseRequestCount()).toBe(1);
      });

      expect(proxy.getPauseRequestCount()).toBe(1);
      expect(proxy.getPlayRequestCount()).toBe(0);
    });
  });

  describe('websocket updates', () => {
    it('VALID: {dispatch-state-changed WS} => toggle flips from PLAY to PAUSE', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderAdapter({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PLAY' })).toBe(true);

      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'node-playing' }) });
      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'dispatch-state-changed',
              payload: {},
              timestamp: '2024-01-15T10:10:00.000Z',
            }),
          });
        },
      });

      await waitFor(() => {
        expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
      });

      expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
    });
  });
});
