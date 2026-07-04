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

    it('VALID: {handler registered; setPlaying to same value} => does NOT fire handler', () => {
      const proxy = orchestrationDispatchStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      orchestrationDispatchState.onChange(handler);
      orchestrationDispatchState.setPlaying({ isPlaying: false });

      expect(handler.mock.calls).toStrictEqual([]);
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
