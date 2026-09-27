import { install } from './install';
import { installProxy } from './install.proxy';

describe('install()', () => {
  it('VALID: {cwd} => runs npm install, returns the result', async () => {
    const proxy = installProxy();
    proxy.setupResult({ exitCode: 0, output: 'added 3 packages' });

    const result = await install({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: 'added 3 packages' });
  });

  it('ERROR: {exitCode: 1, output: "npm ERR! code E404"} => returns it, does not throw', async () => {
    const proxy = installProxy();
    proxy.setupResult({ exitCode: 1, output: 'npm ERR! code E404' });

    const result = await install({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'npm ERR! code E404' });
  });
});
