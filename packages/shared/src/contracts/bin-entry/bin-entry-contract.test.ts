import { binEntryContract } from './bin-entry-contract';
import { BinEntryStub } from './bin-entry.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('binEntryContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => returns expected bin entry shape', () => {
      const result = BinEntryStub();

      expect(result).toStrictEqual({
        binName: 'dungeonmaster-pre-edit-lint',
        binPath: './dist/src/startup/start-pre-edit-hook.js',
      });
    });

    it('VALID: {custom binName and binPath} => parses successfully', () => {
      const result = BinEntryStub({
        binName: ContentTextStub({ value: 'dungeonmaster-pre-bash' }),
        binPath: ContentTextStub({ value: './dist/src/startup/start-pre-bash-hook.js' }),
      });

      expect(result).toStrictEqual({
        binName: 'dungeonmaster-pre-bash',
        binPath: './dist/src/startup/start-pre-bash-hook.js',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing binName} => throws ZodError', () => {
      expect(() =>
        binEntryContract.parse({
          binPath: './dist/src/startup/start-pre-edit-hook.js',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing binPath} => throws ZodError', () => {
      expect(() =>
        binEntryContract.parse({
          binName: 'dungeonmaster-pre-edit-lint',
        }),
      ).toThrow(/Required/u);
    });
  });
});
