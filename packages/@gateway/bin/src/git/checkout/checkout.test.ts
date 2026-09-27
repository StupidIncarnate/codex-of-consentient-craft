import { checkout } from './checkout';
import { checkoutProxy } from './checkout.proxy';

describe('checkout()', () => {
  it('VALID: {branchName: "quest/foo"} => runs git checkout quest/foo', async () => {
    const proxy = checkoutProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 0, output: '' });

    const result = await checkout({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "did not match any"} => returns it, does not throw', async () => {
    const proxy = checkoutProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 1, output: 'did not match any' });

    const result = await checkout({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'did not match any' });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingBranchName, a predicate} => resolves for a branch name the predicate accepts', async () => {
      const proxy = checkoutProxy();
      proxy.returnsMatchingBranchName({
        branchName: (value) => String(value).startsWith('quest/'),
        exitCode: 0,
        output: '',
      });

      const result = await checkout({ cwd: '/repo', branchName: 'quest/computed-at-runtime' });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = checkoutProxy();
      proxy.setupResult({ branchName: 'quest/foo', exitCode: 0, output: '' });

      await checkout({ cwd: '/worktrees/computed-at-runtime', branchName: 'quest/foo' });

      expect(proxy.getCallsFor({ branchName: 'quest/foo' })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['checkout', 'quest/foo'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
