import { UnknownResultKindError } from './unknown-result-kind-error';

describe('UnknownResultKindError', () => {
  describe('constructor()', () => {
    it('VALID: {kind: "dom", known: the six kinds} => names the unknown kind and all six known kinds', () => {
      const error = new UnknownResultKindError({
        kind: 'dom',
        known: ['console', 'network', 'ws', 'server', 'screenshots', 'steps'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UnknownResultKindError',
        message:
          'Unknown result kind "dom". Known kinds: console, network, ws, server, screenshots, steps.',
      });
    });

    it('EDGE: {known: a single kind} => names only the one kind known', () => {
      const error = new UnknownResultKindError({ kind: 'storage', known: ['console'] });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UnknownResultKindError',
        message: 'Unknown result kind "storage". Known kinds: console.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof UnknownResultKindError => returns true', () => {
      const error = new UnknownResultKindError({
        kind: 'dom',
        known: ['console', 'network', 'ws', 'server', 'screenshots', 'steps'],
      });

      expect(error instanceof UnknownResultKindError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new UnknownResultKindError({
        kind: 'dom',
        known: ['console', 'network', 'ws', 'server', 'screenshots', 'steps'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
