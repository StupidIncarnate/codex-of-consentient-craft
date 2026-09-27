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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPid, a predicate} => resolves for a pid the predicate accepts', async () => {
      const proxy = killPidProxy();
      proxy.returnsMatchingPid({
        pid: (value) => Number(value) > 0,
        exitCode: 0,
        output: '',
      });

      const result = await killPid({ pid: 54321 });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = killPidProxy();
      proxy.setupResult({ pid: 12345, exitCode: 0, output: '' });

      await killPid({ pid: 12345 });

      expect(proxy.getCallsFor({ pid: 12345 })).toStrictEqual([
        [{ command: 'kill', args: ['-SIGKILL', '12345'], cwd: '/' }],
      ]);
    });
  });
});
