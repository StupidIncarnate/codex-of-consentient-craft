import { addAll } from './add-all';
import { addAllProxy } from './add-all.proxy';

describe('addAll()', () => {
  it('VALID: {exitCode: 0} => returns the exit code and output', async () => {
    const proxy = addAllProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await addAll({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 128, output: "fatal: not a git repository"} => returns it, does not throw', async () => {
    const proxy = addAllProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: not a git repository' });

    const result = await addAll({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 128, output: 'fatal: not a git repository' });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = addAllProxy();
      proxy.setupResult({ exitCode: 0, output: '' });

      await addAll({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [{ command: 'git', args: ['add', '-A'], cwd: '/worktrees/computed-at-runtime' }],
      ]);
    });
  });
});
