import { DispatchHoldStub } from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchState } from './orchestration-dispatch-state';
import { orchestrationDispatchStateProxy } from './orchestration-dispatch-state.proxy';

describe('orchestrationDispatchState', () => {
  describe('getIsPlaying', () => {
    it('EMPTY: {default} => returns false', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      expect(orchestrationDispatchState.getIsPlaying()).toBe(false);
    });
  });

  describe('setPlaying', () => {
    it('VALID: {setPlaying true} => getIsPlaying returns true', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      orchestrationDispatchState.setPlaying({ isPlaying: true });

      expect(orchestrationDispatchState.getIsPlaying()).toBe(true);
    });

    it('VALID: {setPlaying true then false} => getIsPlaying returns false', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setPlaying({ isPlaying: false });

      expect(orchestrationDispatchState.getIsPlaying()).toBe(false);
    });
  });

  describe('onChange / offChange', () => {
    it('VALID: {handler registered; setPlaying true} => fires handler with {isPlaying: true}', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setPlaying({ isPlaying: true });

      expect(handler.mock.calls).toStrictEqual([[{ isPlaying: true }]]);
    });

    it('VALID: {handler registered; setPlaying to same value} => still fires handler (every play/pause press notifies subscribers)', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setPlaying({ isPlaying: false });

      expect(handler.mock.calls).toStrictEqual([[{ isPlaying: false }]]);
    });

    it('VALID: {already playing; setPlaying true again} => fires onChange again so a re-play re-kicks the node dispatcher (regression: stuck pathseeker on unpause)', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      // Dispatcher already playing (e.g. it played once, found nothing ready, and a quest
      // became ready afterward). Pressing play/resume again must re-notify subscribers so the
      // runner re-scans — not swallow it as an unchanged no-op.
      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setPlaying({ isPlaying: true });

      expect(handler.mock.calls).toStrictEqual([[{ isPlaying: true }]]);
    });

    it('VALID: {handler registered; true then false} => fires twice with correct values', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setPlaying({ isPlaying: false });

      expect(handler.mock.calls).toStrictEqual([[{ isPlaying: true }], [{ isPlaying: false }]]);
    });

    it('VALID: {offChange then setPlaying} => does not fire removed handler', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.offChange(handler);
      orchestrationDispatchState.setPlaying({ isPlaying: true });

      expect(handler.mock.calls).toStrictEqual([]);
    });
  });

  describe('setHold', () => {
    it('VALID: {playing, then a hold arrives} => getIsPlaying returns false', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });

      expect(orchestrationDispatchState.getIsPlaying()).toBe(false);
    });

    it('VALID: {playing, hold arrives then lifts} => getIsPlaying returns true again with no second play press', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });
      orchestrationDispatchState.setHold({ hold: null });

      expect(orchestrationDispatchState.getIsPlaying()).toBe(true);
    });

    it('VALID: {paused, then the hold lifts} => getIsPlaying stays false, because the user never asked to play', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });
      orchestrationDispatchState.setHold({ hold: null });

      expect(orchestrationDispatchState.getIsPlaying()).toBe(false);
    });

    it('VALID: {a hold is live} => getIsPlayRequested still reports the user intent', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });

      expect(orchestrationDispatchState.getIsPlayRequested()).toBe(true);
    });

    it('VALID: {a hold is live, user pauses} => the hold survives the pause', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });
      orchestrationDispatchState.setPlaying({ isPlaying: false });

      expect(orchestrationDispatchState.getHold()).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T06:00:00.000Z',
      });
    });

    it('EMPTY: {default} => getHold returns null', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();

      expect(orchestrationDispatchState.getHold()).toBe(null);
    });
  });

  describe('setHold notification', () => {
    it('VALID: {playing, a hold arrives} => notifies subscribers that dispatch stopped', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });

      expect(handler.mock.calls).toStrictEqual([[{ isPlaying: false }]]);
    });

    it('VALID: {playing, a hold lifts} => notifies, which is the kick that restarts the runner', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });
      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setHold({ hold: null });

      expect(handler.mock.calls).toStrictEqual([[{ isPlaying: true }]]);
    });

    it('VALID: {the same hold re-set on a later poll tick} => does not notify, so the runner is not kicked every few seconds', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });
      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });

      expect(handler.mock.calls).toStrictEqual([]);
    });

    it('VALID: {no hold, setHold null again} => does not notify', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setHold({ hold: null });

      expect(handler.mock.calls).toStrictEqual([]);
    });

    it('VALID: {a hold replaced by a differently-timed one} => notifies, because the resume time moved', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.setPlaying({ isPlaying: true });
      orchestrationDispatchState.setHold({ hold: DispatchHoldStub() });
      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setHold({
        hold: DispatchHoldStub({ heldAt: '2026-09-13T05:00:00.000Z' }),
      });

      expect(handler.mock.calls).toStrictEqual([[{ isPlaying: false }]]);
    });
  });
});
