import { copyRecursive } from './copy-recursive';
import { copyRecursiveProxy } from './copy-recursive.proxy';

describe('copyRecursive()', () => {
  it('VALID: {one source, hardlink omitted} => runs cp -a <source> <destination>', async () => {
    const proxy = copyRecursiveProxy();
    proxy.setupResult({
      sources: ['/repo/dist/pkg'],
      destination: '/worktree/dist/pkg',
      exitCode: 0,
      output: '',
    });

    const result = await copyRecursive({
      sources: ['/repo/dist/pkg'],
      destination: '/worktree/dist/pkg',
      cwd: '/repo',
    });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('VALID: {several sources, hardlink: true} => runs cp -al <sources...> <destination>', async () => {
    const proxy = copyRecursiveProxy();
    proxy.setupResult({
      sources: ['/repo/node_modules/a', '/repo/node_modules/b'],
      destination: '/worktree/node_modules',
      hardlink: true,
      exitCode: 0,
      output: '',
    });

    const result = await copyRecursive({
      sources: ['/repo/node_modules/a', '/repo/node_modules/b'],
      destination: '/worktree/node_modules',
      cwd: '/repo',
      hardlink: true,
    });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {source missing} => returns the non-zero exit, does not throw', async () => {
    const proxy = copyRecursiveProxy();
    proxy.setupResult({
      sources: ['/repo/missing'],
      destination: '/worktree/missing',
      exitCode: 1,
      output: "cp: cannot stat '/repo/missing': No such file or directory",
    });

    const result = await copyRecursive({
      sources: ['/repo/missing'],
      destination: '/worktree/missing',
      cwd: '/repo',
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: "cp: cannot stat '/repo/missing': No such file or directory",
    });
  });
});
