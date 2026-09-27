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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingDestination, a predicate} => resolves for a destination the predicate accepts', async () => {
      const proxy = copyRecursiveProxy();
      proxy.returnsMatchingDestination({
        sources: ['/repo/dist/pkg'],
        destination: (value) => String(value).startsWith('/worktree/'),
        exitCode: 0,
        output: '',
      });

      const result = await copyRecursive({
        sources: ['/repo/dist/pkg'],
        destination: '/worktree/computed-at-runtime/pkg',
        cwd: '/repo',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = copyRecursiveProxy();
      proxy.setupResult({
        sources: ['/repo/dist/pkg'],
        destination: '/worktree/dist/pkg',
        exitCode: 0,
        output: '',
      });

      await copyRecursive({
        sources: ['/repo/dist/pkg'],
        destination: '/worktree/dist/pkg',
        cwd: '/worktrees/computed-at-runtime',
      });

      expect(
        proxy.getCallsFor({ sources: ['/repo/dist/pkg'], destination: '/worktree/dist/pkg' }),
      ).toStrictEqual([
        [
          {
            command: 'cp',
            args: ['-a', '/repo/dist/pkg', '/worktree/dist/pkg'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
