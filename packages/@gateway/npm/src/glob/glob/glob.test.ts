import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import { glob } from './glob';
import { globProxy } from './glob.proxy';

describe('glob', () => {
  it('VALID: {pattern, cwd, ignore} => returns absolute paths, directories excluded by default', async () => {
    const proxy = globProxy();
    proxy.returns({
      pattern: '**/*.ts',
      options: { cwd: '/repo', ignore: ['**/node_modules/**'] },
      matches: ['/repo/src/a.ts', '/repo/src/b.ts'],
    });

    await expect(
      glob('**/*.ts', { cwd: '/repo', ignore: ['**/node_modules/**'] }),
    ).resolves.toStrictEqual(['/repo/src/a.ts', '/repo/src/b.ts']);
  });

  it('VALID: {pattern: an array} => passes every pattern through to glob', async () => {
    const proxy = globProxy();
    proxy.returns({
      pattern: ['*.ts', '*.tsx'],
      options: { cwd: '/repo', ignore: [] },
      matches: ['/repo/a.ts', '/repo/b.tsx'],
    });

    await expect(glob(['*.ts', '*.tsx'], { cwd: '/repo', ignore: [] })).resolves.toStrictEqual([
      '/repo/a.ts',
      '/repo/b.tsx',
    ]);
  });

  it('VALID: {nodir: false} => includes directory matches', async () => {
    const proxy = globProxy();
    proxy.returns({
      pattern: '**/*',
      options: { cwd: '/repo', nodir: false, ignore: [] },
      matches: ['/repo/src', '/repo/src/a.ts'],
    });

    await expect(glob('**/*', { cwd: '/repo', nodir: false, ignore: [] })).resolves.toStrictEqual([
      '/repo/src',
      '/repo/src/a.ts',
    ]);
  });

  it('EMPTY: {matches: none} => returns an empty array', async () => {
    const proxy = globProxy();
    proxy.returns({
      pattern: '**/*.missing',
      options: { cwd: '/repo', ignore: [] },
      matches: [],
    });

    await expect(glob('**/*.missing', { cwd: '/repo', ignore: [] })).resolves.toStrictEqual([]);
  });

  it('ERROR: {cwd: a root that does not exist} => throws a wrapped Error naming the pattern', async () => {
    const proxy = globProxy();
    const error = FileMissingErrorStub({ path: '/repo/missing' });
    proxy.throws({
      pattern: '**/*.ts',
      options: { cwd: '/repo/missing', ignore: [] },
      error,
    });

    await expect(glob('**/*.ts', { cwd: '/repo/missing', ignore: [] })).rejects.toStrictEqual(
      new Error('glob failed for pattern "**/*.ts": ENOENT: open \'/repo/missing\'', {
        cause: error,
      }),
    );
  });

  it('ERROR: {walking a directory that denies access} => throws a wrapped Error naming the pattern', async () => {
    const proxy = globProxy();
    const error = FsErrorStub({ code: 'EACCES', syscall: 'scandir', path: '/repo' });
    proxy.throws({
      pattern: '**/*.ts',
      options: { cwd: '/repo', ignore: [] },
      error,
    });

    await expect(glob('**/*.ts', { cwd: '/repo', ignore: [] })).rejects.toStrictEqual(
      new Error('glob failed for pattern "**/*.ts": EACCES: scandir \'/repo\'', { cause: error }),
    );
  });

  describe('no catch-all', () => {
    it('ERROR: {no call staged} => an unaddressed call throws instead of resolving empty', async () => {
      globProxy();

      await expect(glob('**/*.ts', { cwd: '/repo', ignore: [] })).rejects.toThrow(
        /^glob failed for pattern "\*\*\/\*\.ts": registerMock: nothing set up for the call/u,
      );
    });
  });

  describe('tail-tolerant staging', () => {
    it('VALID: {staged from a bare suffix, called with a different cwd prefix} => matches by pattern tail', async () => {
      const proxy = globProxy();
      proxy.returnsMatchingTail({
        pattern: '**/*.ts',
        matches: ['/real/repo/src/a.ts'],
      });

      await expect(
        glob('/mocked/cwd/**/*.ts', { cwd: '/mocked/cwd', ignore: [] }),
      ).resolves.toStrictEqual(['/real/repo/src/a.ts']);
    });

    it('VALID: {options address names only cwd} => ignore list the real call sends is never checked', async () => {
      const proxy = globProxy();
      proxy.returnsMatchingTail({
        pattern: '**/*.ts',
        options: { cwd: '/repo' },
        matches: ['/repo/src/a.ts'],
      });

      await expect(
        glob('/repo/**/*.ts', { cwd: '/repo', ignore: ['**/node_modules/**', '**/tmp/**'] }),
      ).resolves.toStrictEqual(['/repo/src/a.ts']);
    });

    it('ERROR: {throwsMatchingTail} => rejects the tail-matched call with the staged error', async () => {
      const proxy = globProxy();
      const error = FsErrorStub({ code: 'EACCES', syscall: 'scandir', path: '/mocked/cwd' });
      proxy.throwsMatchingTail({ pattern: '**/*.ts', error });

      await expect(glob('/mocked/cwd/**/*.ts', { cwd: '/mocked/cwd', ignore: [] })).rejects.toThrow(
        /^glob failed for pattern "\/mocked\/cwd\/\*\*\/\*\.ts": EACCES: scandir '\/mocked\/cwd'$/u,
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getOptionsFor and getCallsFor read it back', async () => {
      const proxy = globProxy();
      proxy.returnsMatchingTail({ pattern: '**/*.ts', matches: [] });

      await glob('/repo/**/*.ts', { cwd: '/repo', ignore: ['**/node_modules/**'] });

      const resolvedOptions = {
        cwd: '/repo',
        absolute: true,
        nodir: true,
        ignore: ['**/node_modules/**'],
      };

      expect(proxy.getOptionsFor({ pattern: '**/*.ts' })).toStrictEqual(resolvedOptions);
      expect(proxy.getCallsFor({ pattern: '**/*.ts' })).toStrictEqual([
        ['/repo/**/*.ts', resolvedOptions],
      ]);
    });
  });
});
