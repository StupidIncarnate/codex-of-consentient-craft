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
});
