/**
 * PURPOSE: Tests for eslint-fallback-paths-broker
 */
import { eslintFallbackPathsBrokerProxy } from './eslint-fallback-paths-broker.proxy';
import { eslintFallbackPathsBroker } from './eslint-fallback-paths-broker';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('eslintFallbackPathsBroker', () => {
  it('VALID: {cwd: nested path} => returns fallback paths from deepest to root', () => {
    eslintFallbackPathsBrokerProxy();

    const result = eslintFallbackPathsBroker({ cwd: FilePathStub({ value: '/a/b/c' }) });

    expect(result).toStrictEqual([
      '/a/b/c/fallback.ts',
      '/a/b/fallback.ts',
      '/a/fallback.ts',
      '/fallback.ts',
    ]);
  });

  it('VALID: {cwd: root} => returns single fallback path at root', () => {
    eslintFallbackPathsBrokerProxy();

    const result = eslintFallbackPathsBroker({ cwd: FilePathStub({ value: '/' }) });

    expect(result).toStrictEqual(['/fallback.ts']);
  });

  it('VALID: {cwd: single level} => returns two fallback paths', () => {
    eslintFallbackPathsBrokerProxy();

    const result = eslintFallbackPathsBroker({ cwd: FilePathStub({ value: '/project' }) });

    expect(result).toStrictEqual(['/project/fallback.ts', '/fallback.ts']);
  });
});
