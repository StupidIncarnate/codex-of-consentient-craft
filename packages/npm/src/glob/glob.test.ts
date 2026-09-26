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
    const error = Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });
    proxy.throws({
      pattern: '**/*.ts',
      options: { cwd: '/repo/missing', ignore: [] },
      error,
    });

    await expect(glob('**/*.ts', { cwd: '/repo/missing', ignore: [] })).rejects.toStrictEqual(
      new Error('glob failed for pattern "**/*.ts": ENOENT: no such file or directory', {
        cause: error,
      }),
    );
  });

  it('ERROR: {walking a directory that denies access} => throws a wrapped Error naming the pattern', async () => {
    const proxy = globProxy();
    const error = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
    proxy.throws({
      pattern: '**/*.ts',
      options: { cwd: '/repo', ignore: [] },
      error,
    });

    await expect(glob('**/*.ts', { cwd: '/repo', ignore: [] })).rejects.toStrictEqual(
      new Error('glob failed for pattern "**/*.ts": EACCES: permission denied', { cause: error }),
    );
  });
});
