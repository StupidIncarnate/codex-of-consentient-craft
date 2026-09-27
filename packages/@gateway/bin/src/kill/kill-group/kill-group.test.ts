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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPgid, a predicate} => resolves for a pgid the predicate accepts', async () => {
      const proxy = killGroupProxy();
      proxy.returnsMatchingPgid({
        pgid: (value) => String(value).startsWith('-'),
        exitCode: 0,
        output: '',
      });

      const result = await killGroup({ pgid: 54321 });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = killGroupProxy();
      proxy.setupResult({ pgid: 12345, exitCode: 0, output: '' });

      await killGroup({ pgid: 12345 });

      expect(proxy.getCallsFor({ pgid: 12345 })).toStrictEqual([
        [{ command: 'kill', args: ['-SIGKILL', '-12345'], cwd: '/' }],
      ]);
    });
  });
});
