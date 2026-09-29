import { globSync } from './glob-sync';
import { globSyncProxy } from './glob-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('globSync', () => {
  it('VALID: {patterns, cwd} => returns every matching path', () => {
    const proxy = globSyncProxy();
    proxy.returns({
      patterns: '**/*.ts',
      cwd: '/repo/packages/node/src',
      matches: ['fs/index.ts', 'fs/glob-sync.ts'],
    });

    expect(globSync({ patterns: '**/*.ts', cwd: '/repo/packages/node/src' })).toStrictEqual([
      'fs/index.ts',
      'fs/glob-sync.ts',
    ]);
  });

  it('VALID: {patterns: an array} => returns every matching path across all patterns', () => {
    const proxy = globSyncProxy();
    proxy.returns({
      patterns: ['*.ts', '*.tsx'],
      cwd: '/repo/packages/web/src',
      matches: ['a.ts', 'b.tsx'],
    });

    expect(globSync({ patterns: ['*.ts', '*.tsx'], cwd: '/repo/packages/web/src' })).toStrictEqual([
      'a.ts',
      'b.tsx',
    ]);
  });

  it('VALID: {exclude: a predicate} => omits matches the predicate excludes', () => {
    const proxy = globSyncProxy();
    const exclude = (path: string): boolean => path.includes('node_modules');
    proxy.returns({ patterns: '**/*.ts', cwd: '/repo', matches: ['src/a.ts'] });

    expect(globSync({ patterns: '**/*.ts', cwd: '/repo', exclude })).toStrictEqual(['src/a.ts']);
  });

  it('EMPTY: {patterns: match nothing} => returns an empty array', () => {
    const proxy = globSyncProxy();
    proxy.returns({ patterns: '**/*.missing', cwd: '/repo', matches: [] });

    expect(globSync({ patterns: '**/*.missing', cwd: '/repo' })).toStrictEqual([]);
  });

  it('ERROR: {cwd: missing, ENOENT} => throws the raw error', () => {
    const proxy = globSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/missing' });
    proxy.throws({ patterns: '**/*.ts', cwd: '/repo/missing', error });

    expect(() => globSync({ patterns: '**/*.ts', cwd: '/repo/missing' })).toThrow(error);
  });

  describe('getCallsFor read-back', () => {
    it('VALID: {two calls, one with an exclude} => records patterns and options of each call in order', () => {
      const proxy = globSyncProxy();
      proxy.returns({ patterns: '**/*.ts', cwd: '/repo/src', matches: ['a.ts'] });
      const exclude = ['node_modules'];

      globSync({ patterns: '**/*.ts', cwd: '/repo/src' });
      globSync({ patterns: '**/*.ts', cwd: '/repo/src', exclude });

      expect(proxy.getCallsFor({ patterns: '**/*.ts', cwd: '/repo/src' })).toStrictEqual([
        ['**/*.ts', { cwd: '/repo/src' }],
        ['**/*.ts', { cwd: '/repo/src', exclude }],
      ]);
    });
  });
});
