import { ShotDimensionMismatchError } from './shot-dimension-mismatch-error';

describe('ShotDimensionMismatchError', () => {
  describe('constructor()', () => {
    it('VALID: {previousSize: "1280x720", currentSize: "1024x768"} => names both paths and both sizes', () => {
      const error = new ShotDimensionMismatchError({
        previousPath:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step2.png',
        currentPath:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        previousSize: '1280x720',
        currentSize: '1024x768',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'ShotDimensionMismatchError',
        message:
          'Shot dimension mismatch: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_1/step2.png is 1280x720 but /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/runs/run_2/step1.png is 1024x768 — pixelChange cannot compare captures of different sizes',
      });
    });

    it('VALID: {message} => matches an anchored regex naming both sizes', () => {
      const error = new ShotDimensionMismatchError({
        previousPath: '/repo/.dungeonmaster-assets/siegelense-assets/.../run_1/step2.png',
        currentPath: '/repo/.dungeonmaster-assets/siegelense-assets/.../run_2/step1.png',
        previousSize: '1280x720',
        currentSize: '1024x768',
      });

      expect(error.message).toMatch(
        /^Shot dimension mismatch: .+ is 1280x720 but .+ is 1024x768 — pixelChange cannot compare captures of different sizes$/u,
      );
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof ShotDimensionMismatchError => returns true', () => {
      const error = new ShotDimensionMismatchError({
        previousPath: '/repo/step2.png',
        currentPath: '/repo/step1.png',
        previousSize: '1280x720',
        currentSize: '1024x768',
      });

      expect(error instanceof ShotDimensionMismatchError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new ShotDimensionMismatchError({
        previousPath: '/repo/step2.png',
        currentPath: '/repo/step1.png',
        previousSize: '1280x720',
        currentSize: '1024x768',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
