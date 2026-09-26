import { addAll } from './git-add-all';
import { gitAddAllProxy } from './git-add-all.proxy';

describe('addAll()', () => {
  it('VALID: {exitCode: 0} => returns the exit code and output', async () => {
    const proxy = gitAddAllProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await addAll({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 128, output: "fatal: not a git repository"} => returns it, does not throw', async () => {
    const proxy = gitAddAllProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: not a git repository' });

    const result = await addAll({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 128, output: 'fatal: not a git repository' });
  });
});
