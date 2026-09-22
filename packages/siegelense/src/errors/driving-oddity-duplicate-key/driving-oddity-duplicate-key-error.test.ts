import { DrivingOddityDuplicateKeyError } from './driving-oddity-duplicate-key-error';

describe('DrivingOddityDuplicateKeyError', () => {
  describe('with a duplicate key', () => {
    it('VALID: {key, filePath} => creates error naming the key and the file it already lives in', () => {
      const error = new DrivingOddityDuplicateKeyError({
        key: 'GUILD_ADD_MODAL',
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
      });

      expect({
        name: error.name,
        message: error.message,
        key: error.key,
        filePath: error.filePath,
      }).toStrictEqual({
        name: 'DrivingOddityDuplicateKeyError',
        message:
          'Driving-oddity file at /repo/.dungeonmaster-assets/driving-oddities.jsonl already has an entry keyed "GUILD_ADD_MODAL" — append refuses a duplicate; edit the existing line by hand to correct it.',
        key: 'GUILD_ADD_MODAL',
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof DrivingOddityDuplicateKeyError => returns true', () => {
      const error = new DrivingOddityDuplicateKeyError({
        key: 'GUILD_ADD_MODAL',
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
      });

      expect(error instanceof DrivingOddityDuplicateKeyError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new DrivingOddityDuplicateKeyError({
        key: 'GUILD_ADD_MODAL',
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
