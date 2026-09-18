import { StepFileNotFoundError } from './step-file-not-found-error';

describe('StepFileNotFoundError', () => {
  describe('instantiation', () => {
    it('VALID: {path, homePath} => creates error with message and properties', () => {
      const error = new StepFileNotFoundError({
        path: 'guilds/g1/quests/q1/quest.json',
        homePath: '/tmp/lane-home',
      });

      expect({
        name: error.name,
        message: error.message,
        path: error.path,
        homePath: error.homePath,
      }).toStrictEqual({
        name: 'StepFileNotFoundError',
        message:
          'file "guilds/g1/quests/q1/quest.json" does not exist in lane home "/tmp/lane-home"',
        path: 'guilds/g1/quests/q1/quest.json',
        homePath: '/tmp/lane-home',
      });
    });

    it('VALID: error instanceof Error => inherits from Error', () => {
      const error = new StepFileNotFoundError({
        path: 'missing.txt',
        homePath: '/tmp/lane-home',
      });

      expect(error instanceof Error).toBe(true);
      expect(error instanceof StepFileNotFoundError).toBe(true);
    });
  });
});
