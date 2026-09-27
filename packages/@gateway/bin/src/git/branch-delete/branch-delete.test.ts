import { branchDelete } from './branch-delete';
import { branchDeleteProxy } from './branch-delete.proxy';

describe('branchDelete()', () => {
  it('VALID: {branchName: "quest/foo"} => runs git branch -D quest/foo', async () => {
    const proxy = branchDeleteProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 0, output: '' });

    const result = await branchDelete({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "not found"} => returns it, does not throw', async () => {
    const proxy = branchDeleteProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 1, output: 'not found' });

    const result = await branchDelete({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'not found' });
  });
});
