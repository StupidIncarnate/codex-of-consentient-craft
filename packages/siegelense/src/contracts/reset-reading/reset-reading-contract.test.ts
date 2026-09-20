import { resetReadingContract } from './reset-reading-contract';
import { ResetReadingStub } from './reset-reading.stub';

describe('resetReadingContract', () => {
  describe('valid shapes', () => {
    it('VALID: default stub => parses successfully', () => {
      const stub = ResetReadingStub();

      const result = resetReadingContract.parse(stub);

      expect(result).toStrictEqual({
        restored: 'clean',
        undid: {
          files: 0,
          added: 0,
          modified: 0,
          removed: 0,
        },
        NOT_cleared: ['server memory', 'open websockets'],
      });
    });

    it('VALID: page reset shape => parses successfully', () => {
      const stub = ResetReadingStub({
        restored: 'page',
        NOT_cleared: ['disk', 'server memory'],
      });

      const result = resetReadingContract.parse(stub);

      expect(result).toStrictEqual({
        restored: 'page',
        undid: {
          files: 0,
          added: 0,
          modified: 0,
          removed: 0,
        },
        NOT_cleared: ['disk', 'server memory'],
      });
    });
  });

  describe('invalid shapes', () => {
    it('INVALID: {restored: 123} => non-string restored throws validation error', () => {
      expect(() => {
        ResetReadingStub({ restored: 123 as never });
      }).toThrow(/Expected string/u);
    });
  });
});
