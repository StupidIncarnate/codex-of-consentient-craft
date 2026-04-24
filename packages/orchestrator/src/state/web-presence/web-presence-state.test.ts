import { webPresenceState } from './web-presence-state';
import { webPresenceStateProxy } from './web-presence-state.proxy';

describe('webPresenceState', () => {
  describe('getIsPresent', () => {
    it('EMPTY: {default} => returns false', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();

      expect(webPresenceState.getIsPresent()).toBe(false);
    });
  });

  describe('setPresent', () => {
    it('VALID: {setPresent true} => getIsPresent returns true', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();

      webPresenceState.setPresent({ isPresent: true });

      expect(webPresenceState.getIsPresent()).toBe(true);
    });

    it('VALID: {setPresent true then false} => getIsPresent returns false', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();

      webPresenceState.setPresent({ isPresent: true });
      webPresenceState.setPresent({ isPresent: false });

      expect(webPresenceState.getIsPresent()).toBe(false);
    });
  });

  describe('onChange / offChange', () => {
    it('VALID: {handler registered; setPresent true} => fires handler with {isPresent: true}', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      webPresenceState.onChange(handler);
      webPresenceState.setPresent({ isPresent: true });

      expect(handler.mock.calls).toStrictEqual([[{ isPresent: true }]]);
    });

    it('VALID: {handler registered; setPresent to same value} => does NOT fire handler', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      webPresenceState.onChange(handler);
      webPresenceState.setPresent({ isPresent: false });

      expect(handler.mock.calls).toStrictEqual([]);
    });

    it('VALID: {handler registered; true then true} => fires only once', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      webPresenceState.onChange(handler);
      webPresenceState.setPresent({ isPresent: true });
      webPresenceState.setPresent({ isPresent: true });

      expect(handler.mock.calls).toStrictEqual([[{ isPresent: true }]]);
    });

    it('VALID: {handler registered; true then false} => fires twice with correct values', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      webPresenceState.onChange(handler);
      webPresenceState.setPresent({ isPresent: true });
      webPresenceState.setPresent({ isPresent: false });

      expect(handler.mock.calls).toStrictEqual([[{ isPresent: true }], [{ isPresent: false }]]);
    });

    it('VALID: {offChange then setPresent} => does not fire removed handler', () => {
      const proxy = webPresenceStateProxy();
      proxy.setupEmpty();
      const handler = jest.fn();

      webPresenceState.onChange(handler);
      webPresenceState.offChange(handler);
      webPresenceState.setPresent({ isPresent: true });

      expect(handler.mock.calls).toStrictEqual([]);
    });
  });
});
