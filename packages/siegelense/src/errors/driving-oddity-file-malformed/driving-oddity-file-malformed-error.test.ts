import { DrivingOddityFileMalformedError } from './driving-oddity-file-malformed-error';

describe('DrivingOddityFileMalformedError', () => {
  describe('with a malformed line', () => {
    it('VALID: {filePath, lineNumber, line, cause} => creates error naming the file, line number and line text', () => {
      const cause = new Error('Unexpected token');
      const error = new DrivingOddityFileMalformedError({
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
        lineNumber: 4,
        line: '{"key":"GUILD_ADD_MODAL"',
        cause,
      });

      expect({
        name: error.name,
        message: error.message,
        filePath: error.filePath,
        lineNumber: error.lineNumber,
        line: error.line,
        cause: error.cause,
      }).toStrictEqual({
        name: 'DrivingOddityFileMalformedError',
        message:
          'Driving-oddity file at /repo/.dungeonmaster-assets/driving-oddities.jsonl has a line that will not parse — line 4: {"key":"GUILD_ADD_MODAL"',
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
        lineNumber: 4,
        line: '{"key":"GUILD_ADD_MODAL"',
        cause,
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof DrivingOddityFileMalformedError => returns true', () => {
      const error = new DrivingOddityFileMalformedError({
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
        lineNumber: 1,
        line: '{}',
        cause: undefined,
      });

      expect(error instanceof DrivingOddityFileMalformedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new DrivingOddityFileMalformedError({
        filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
        lineNumber: 1,
        line: '{}',
        cause: undefined,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
