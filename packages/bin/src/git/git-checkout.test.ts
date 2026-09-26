import { checkout } from './git-checkout';
import { gitCheckoutProxy } from './git-checkout.proxy';

describe('checkout()', () => {
  it('VALID: {branchName: "quest/foo"} => runs git checkout quest/foo', async () => {
    const proxy = gitCheckoutProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 0, output: '' });

    const result = await checkout({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "did not match any"} => returns it, does not throw', async () => {
    const proxy = gitCheckoutProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 1, output: 'did not match any' });

    const result = await checkout({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'did not match any' });
  });
});
