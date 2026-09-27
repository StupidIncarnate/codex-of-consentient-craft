import { push } from './push';
import { pushProxy } from './push.proxy';

describe('push()', () => {
  it('VALID: {no setUpstream} => runs a plain push', async () => {
    const proxy = pushProxy();
    proxy.setupPlainPush({ exitCode: 0, output: '' });

    const result = await push({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('VALID: {setUpstream: {branchName}} => runs push -u origin <branchName>', async () => {
    const proxy = pushProxy();
    proxy.setupUpstreamPush({ branchName: 'quest/foo', exitCode: 0, output: '' });

    const result = await push({ cwd: '/repo', setUpstream: { branchName: 'quest/foo' } });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "rejected"} => returns it, does not throw', async () => {
    const proxy = pushProxy();
    proxy.setupPlainPush({ exitCode: 1, output: 'rejected' });

    const result = await push({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'rejected' });
  });
});
