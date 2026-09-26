import { killPid } from './kill-pid';
import { killPidProxy } from './kill-pid.proxy';

describe('killPid()', () => {
  it('VALID: {pid: 12345} => runs kill -SIGKILL 12345 by default', async () => {
    const proxy = killPidProxy();
    proxy.setupResult({ pid: 12345, exitCode: 0, output: '' });

    const result = await killPid({ pid: 12345 });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('VALID: {pid, signal: "SIGTERM"} => runs kill -SIGTERM <pid>', async () => {
    const proxy = killPidProxy();
    proxy.setupResult({ pid: 12345, signal: 'SIGTERM', exitCode: 0, output: '' });

    const result = await killPid({ pid: 12345, signal: 'SIGTERM' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('EDGE: {pid already exited} => returns the non-zero exit, does not throw', async () => {
    const proxy = killPidProxy();
    proxy.setupResult({
      pid: 12345,
      exitCode: 1,
      output: 'kill: (12345): No such process',
    });

    const result = await killPid({ pid: 12345 });

    expect(result).toStrictEqual({ exitCode: 1, output: 'kill: (12345): No such process' });
  });
});
