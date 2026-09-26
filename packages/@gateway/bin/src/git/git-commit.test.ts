import { commit } from './git-commit';
import { commitProxy } from './git-commit.proxy';

describe('commit()', () => {
  it('VALID: {message: "work items: 3"} => runs plain commit, returns the result', async () => {
    const proxy = commitProxy();
    proxy.setupResult({ message: 'work items: 3', exitCode: 0, output: '' });

    const result = await commit({ cwd: '/repo', message: 'work items: 3' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('VALID: {message, allowEmpty: true} => runs commit --allow-empty, returns the result', async () => {
    const proxy = commitProxy();
    proxy.setupResult({
      message: 'ward/commit: repair',
      allowEmpty: true,
      exitCode: 0,
      output: '',
    });

    const result = await commit({ cwd: '/repo', message: 'ward/commit: repair', allowEmpty: true });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "nothing to commit"} => returns it, does not throw', async () => {
    const proxy = commitProxy();
    proxy.setupResult({ message: 'x', exitCode: 1, output: 'nothing to commit' });

    const result = await commit({ cwd: '/repo', message: 'x' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'nothing to commit' });
  });
});
