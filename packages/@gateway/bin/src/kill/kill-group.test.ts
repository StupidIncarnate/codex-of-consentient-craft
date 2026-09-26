import { killGroup } from './kill-group';
import { killGroupProxy } from './kill-group.proxy';

describe('killGroup()', () => {
  it('VALID: {pgid: 12345} => runs kill -SIGKILL -12345 by default', async () => {
    const proxy = killGroupProxy();
    proxy.setupResult({ pgid: 12345, exitCode: 0, output: '' });

    const result = await killGroup({ pgid: 12345 });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('EDGE: {group already exited} => returns the non-zero exit, does not throw', async () => {
    const proxy = killGroupProxy();
    proxy.setupResult({ pgid: 12345, exitCode: 1, output: 'kill: (12345): No such process' });

    const result = await killGroup({ pgid: 12345 });

    expect(result).toStrictEqual({ exitCode: 1, output: 'kill: (12345): No such process' });
  });
});
