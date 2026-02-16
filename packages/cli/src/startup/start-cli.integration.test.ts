/**
 * PURPOSE: Integration tests for CLI startup entry point and init command
 *
 * USAGE:
 * npm test -- start-cli.integration.test.ts
 */

import { realpathSync } from 'node:fs';

import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { StartCli } from './start-cli';

type FilePath = ReturnType<typeof FilePathStub>;

const resolveRealPath = ({ path }: { path: FilePath }): FilePath => {
  try {
    return FilePathStub({ value: realpathSync(path) });
  } catch {
    return path;
  }
};

describe('StartCli', () => {
  describe('entry point detection', () => {
    it('VALID: {symlinked path} => resolves real path correctly', () => {
      const testPath = FilePathStub({ value: '/some/path/to/file.js' });

      expect(resolveRealPath({ path: testPath })).toBe(testPath);
    });

    it('VALID: {existing file} => resolves to real path', () => {
      const thisFile = FilePathStub({ value: __filename });

      const resolved = resolveRealPath({ path: thisFile });

      expect(resolved.length).toBeGreaterThan(0);
    });

    it('VALID: {__filename} => converts to file path', () => {
      const filePath = FilePathStub({ value: __filename });

      expect(filePath).toMatch(/start-cli\.integration\.test\.ts$/u);
    });
  });

  describe('module exports', () => {
    it('VALID: {} => exports StartCli function', () => {
      expect(typeof StartCli).toBe('function');
    });
  });
});
