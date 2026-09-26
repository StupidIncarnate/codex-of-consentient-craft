import { isBannedPlatformDeclarationFileGuard } from './is-banned-platform-declaration-file-guard';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('isBannedPlatformDeclarationFileGuard', () => {
  describe('banned files', () => {
    it('VALID: {fileName: lib.dom.d.ts} => returns true', () => {
      const result = isBannedPlatformDeclarationFileGuard({
        fileName: FilePathStub({ value: '/repo/node_modules/typescript/lib/lib.dom.d.ts' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {fileName: lib.dom.iterable.d.ts} => returns true', () => {
      const result = isBannedPlatformDeclarationFileGuard({
        fileName: FilePathStub({
          value: '/repo/node_modules/typescript/lib/lib.dom.iterable.d.ts',
        }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {fileName: lib.webworker.d.ts} => returns true', () => {
      const result = isBannedPlatformDeclarationFileGuard({
        fileName: FilePathStub({ value: '/repo/node_modules/typescript/lib/lib.webworker.d.ts' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {fileName under @types/node} => returns true', () => {
      const result = isBannedPlatformDeclarationFileGuard({
        fileName: FilePathStub({ value: '/repo/node_modules/@types/node/globals.d.ts' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('not banned', () => {
    it('INVALID: {fileName: lib.es5.d.ts} => returns false', () => {
      const result = isBannedPlatformDeclarationFileGuard({
        fileName: FilePathStub({ value: '/repo/node_modules/typescript/lib/lib.es5.d.ts' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {fileName is the linted file itself} => returns false', () => {
      const result = isBannedPlatformDeclarationFileGuard({
        fileName: FilePathStub({ value: '/repo/packages/eslint-plugin/src/index.ts' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('empty', () => {
    it('EMPTY: {fileName: undefined} => returns false', () => {
      const result = isBannedPlatformDeclarationFileGuard({});

      expect(result).toBe(false);
    });
  });
});
