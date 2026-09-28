import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { globDiscoverFilesBroker } from './glob-discover-files-broker';
import { globDiscoverFilesBrokerProxy } from './glob-discover-files-broker.proxy';

describe('globDiscoverFilesBroker', () => {
  describe('matching files', () => {
    it('VALID: {patterns with matches} => returns count and file list', () => {
      const proxy = globDiscoverFilesBrokerProxy();
      proxy.returnsForPattern({
        pattern: 'src/**/*.ts',
        files: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      });

      const result = globDiscoverFilesBroker({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        discoveredCount: 3,
        discoveredFiles: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      });
    });
  });

  describe('no matches', () => {
    it('VALID: {patterns with no matches} => returns 0 and empty file list', () => {
      const proxy = globDiscoverFilesBrokerProxy();
      proxy.returnsForPattern({ pattern: 'src/**/*.ts', files: [] });

      const result = globDiscoverFilesBroker({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        discoveredCount: 0,
        discoveredFiles: [],
      });
    });
  });

  describe('exclude patterns', () => {
    it('VALID: {patterns with exclude} => returns filtered count and files', () => {
      const proxy = globDiscoverFilesBrokerProxy();
      proxy.returnsForPattern({
        pattern: 'src/**/*.ts',
        files: ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts'],
      });

      const result = globDiscoverFilesBroker({
        patterns: ['src/**/*.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        exclude: ['**/*.integration.test.ts'],
      });

      expect(result).toStrictEqual({
        discoveredCount: 5,
        discoveredFiles: ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts'],
      });
    });
  });

  describe('overlapping patterns', () => {
    it('VALID: {file matches multiple patterns} => deduped, counted once', () => {
      const proxy = globDiscoverFilesBrokerProxy();
      proxy.returnsForPattern({ pattern: '@types/**/*.ts', files: ['@types/x.d.ts'] });
      proxy.returnsForPattern({ pattern: '@types/**/*.d.ts', files: ['@types/x.d.ts'] });

      const result = globDiscoverFilesBroker({
        patterns: ['@types/**/*.ts', '@types/**/*.d.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        discoveredCount: 1,
        discoveredFiles: ['@types/x.d.ts'],
      });
    });
  });

  describe('patterns scoped to a directory', () => {
    it('VALID: {same pattern, two directories} => each directory answers its own files', () => {
      const proxy = globDiscoverFilesBrokerProxy();
      proxy.returnsForPatternInDir({
        pattern: 'src/**',
        cwd: AbsoluteFilePathStub({ value: '/project-a' }),
        files: ['src/a.ts'],
      });
      proxy.returnsForPatternInDir({
        pattern: 'src/**',
        cwd: AbsoluteFilePathStub({ value: '/project-b' }),
        files: ['src/b.ts'],
      });

      const result = globDiscoverFilesBroker({
        patterns: ['src/**'],
        cwd: AbsoluteFilePathStub({ value: '/project-b' }),
      });

      expect(result).toStrictEqual({
        discoveredCount: 1,
        discoveredFiles: ['src/b.ts'],
      });
    });
  });

  describe('every pattern in a known list', () => {
    it('VALID: {returnsForPatterns, several patterns} => any of them answers the same files', () => {
      const proxy = globDiscoverFilesBrokerProxy();
      proxy.returnsForPatterns({
        patterns: ['src/**/*.test.ts', 'test/**/*.test.ts'],
        files: ['src/a.test.ts'],
      });

      const result = globDiscoverFilesBroker({
        patterns: ['src/**/*.test.ts', 'test/**/*.test.ts'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        discoveredCount: 1,
        discoveredFiles: ['src/a.test.ts'],
      });
    });
  });
});
