import { CapacityRefusedError } from './capacity-refused-error';

describe('CapacityRefusedError', () => {
  describe('constructor()', () => {
    it('VALID: {specName, a memory why} => sets name and carries the whole sentence verbatim', () => {
      const error = new CapacityRefusedError({
        specName: 'dungeonmaster-web',
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 3111MB less 512MB headroom; nothing else up; ' +
          'no room for one more: 2599MB available is under the 2600MB this spec peaks at',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'CapacityRefusedError',
        message:
          'Refusing to start dungeonmaster-web: this machine cannot hold another instance right now — ' +
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 3111MB less 512MB headroom; nothing else up; ' +
          'no room for one more: 2599MB available is under the 2600MB this spec peaks at. ' +
          "Run 'dungeonmaster siegelense capacity' to see the same reading, or " +
          "'dungeonmaster siegelense cleanup' to reap anything stale first.",
      });
    });

    it('VALID: {a full-pool why} => the same shape carries the policy reason instead', () => {
      const error = new CapacityRefusedError({
        specName: 'dungeonmaster-headless',
        why: '3 siege instances already up; the policy pool of 3 is full',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'CapacityRefusedError',
        message:
          'Refusing to start dungeonmaster-headless: this machine cannot hold another instance right now — ' +
          '3 siege instances already up; the policy pool of 3 is full. ' +
          "Run 'dungeonmaster siegelense capacity' to see the same reading, or " +
          "'dungeonmaster siegelense cleanup' to reap anything stale first.",
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof CapacityRefusedError => returns true', () => {
      const error = new CapacityRefusedError({ specName: 'dungeonmaster-web', why: 'no room' });

      expect(error instanceof CapacityRefusedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new CapacityRefusedError({ specName: 'dungeonmaster-web', why: 'no room' });

      expect(error instanceof Error).toBe(true);
    });
  });
});
