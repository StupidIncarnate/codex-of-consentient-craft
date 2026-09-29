import { waitFor } from '#gateway/npm/testing-library__react';

import { DispatchHoldStub, DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { act } from '#gateway/npm/testing-library__react';
import { DispatchToggleWidget } from './dispatch-toggle-widget';
import { DispatchToggleWidgetProxy } from './dispatch-toggle-widget.proxy';

describe('DispatchToggleWidget', () => {
  describe('label by mode', () => {
    it('VALID: {mode: paused} => shows PLAY button', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PLAY' })).toBe(true);
    });

    it('VALID: {mode: node-playing} => shows PAUSE button', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'node-playing' }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
    });

    it('EMPTY: {state loading} => renders nothing before the fetch resolves', () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      expect(proxy.hasToggle()).toBe(false);
    });
  });

  describe('click PLAY', () => {
    it('VALID: {paused} => fires POST to the play endpoint', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });
      proxy.setupPlay({ state: DispatchStateStub({ mode: 'node-playing' }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');
      await proxy.clickToggle();

      await waitFor(() => {
        expect(proxy.getPlayRequestCount()).toBe(1);
      });

      expect(proxy.getPlayRequestCount()).toBe(1);
      expect(proxy.getPauseRequestCount()).toBe(0);
    });
  });

  describe('click PAUSE', () => {
    it('VALID: {node-playing} => fires POST to the pause endpoint', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'node-playing' }) });
      proxy.setupPause({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

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

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PLAY' })).toBe(true);

      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'node-playing' }) });
      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'dispatch-state-changed',
            payload: {},
            timestamp: '2024-01-15T10:10:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
      });

      expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
    });
  });

  describe('the rate-limit hold notice', () => {
    it('VALID: {a live hold} => renders the notice naming the window and the wait', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({
        state: DispatchStateStub({
          mode: 'node-playing',
          hold: DispatchHoldStub({
            detail: '7d window at 93% — dispatch holds until it resets',
            resumeAt: '2099-01-01T00:00:00.000Z',
          }),
        }),
      });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_HOLD_NOTICE');

      // The trailing duration is measured against the real clock, so the tail is left open; the
      // exact wording of that countdown is pinned in the notice widget's own suite.
      expect(proxy.holdNoticeText()).toMatch(
        /^HELD — 7d window at 93% — dispatch holds until it resets · resumes in .+$/u,
      );
    });

    it('EMPTY: {no hold} => renders no notice, so an ordinary pause reads as an ordinary pause', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.holdNoticeText()).toBe(null);
    });

    it('VALID: {a live hold while playing} => the button still reads PAUSE, because the hold is not the user lever', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({
        state: DispatchStateStub({ mode: 'node-playing', hold: DispatchHoldStub() }),
      });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PAUSE' })).toBe(true);
    });

    it('VALID: {a live hold while paused} => the button still reads PLAY', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({
        state: DispatchStateStub({ mode: 'paused', hold: DispatchHoldStub() }),
      });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.hasToggleLabel({ text: 'PLAY' })).toBe(true);
    });
  });

  describe('the button while a hold stands', () => {
    it('VALID: {a live hold while paused} => PLAY is disabled, because pressing it cannot help', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({
        state: DispatchStateStub({ mode: 'paused', hold: DispatchHoldStub() }),
      });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.isToggleDisabled()).toBe(true);
    });

    it('VALID: {a live hold while playing} => PAUSE stays enabled, because stopping the queue is always the user lever', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({
        state: DispatchStateStub({ mode: 'node-playing', hold: DispatchHoldStub() }),
      });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.isToggleDisabled()).toBe(false);
    });

    it('VALID: {a live hold while playing} => clicking PAUSE still posts to the pause endpoint', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({
        state: DispatchStateStub({ mode: 'node-playing', hold: DispatchHoldStub() }),
      });
      proxy.setupPause({ state: DispatchStateStub({ mode: 'paused', hold: DispatchHoldStub() }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');
      await proxy.clickToggle();

      await waitFor(() => {
        expect(proxy.getPauseRequestCount()).toBe(1);
      });

      expect(proxy.getPauseRequestCount()).toBe(1);
    });

    it('EMPTY: {no hold while paused} => PLAY is enabled', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.isToggleDisabled()).toBe(false);
    });

    it('VALID: {a hold lands over a paused queue mid-session} => PLAY goes from enabled to disabled with no reload', async () => {
      const proxy = DispatchToggleWidgetProxy();
      proxy.setupConnectedChannel();
      proxy.setupDispatchState({ state: DispatchStateStub({ mode: 'paused' }) });

      const { findByTestId } = mantineRenderMiddleware({ ui: <DispatchToggleWidget /> });

      await findByTestId('DISPATCH_TOGGLE');

      expect(proxy.isToggleDisabled()).toBe(false);

      proxy.setupDispatchState({
        state: DispatchStateStub({ mode: 'paused', hold: DispatchHoldStub() }),
      });
      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'dispatch-state-changed',
            payload: {},
            timestamp: '2024-01-15T10:10:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.isToggleDisabled()).toBe(true);
      });

      expect(proxy.isToggleDisabled()).toBe(true);
    });
  });
});
