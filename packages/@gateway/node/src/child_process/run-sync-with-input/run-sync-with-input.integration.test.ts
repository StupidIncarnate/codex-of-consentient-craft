import { RunNotFoundError } from '../run-not-found.error';
import { runSyncWithInput } from './run-sync-with-input';

describe('runSyncWithInput()', () => {
  describe('real process', () => {
    it('VALID: {node echoes stdin to stdout and a note to stderr, exits 3} => the input round-trips and each stream stays separate', () => {
      const result = runSyncWithInput({
        command: 'node',
        args: [
          '-e',
          "let d='';process.stdin.on('data',(c)=>{d+=c}).on('end',()=>{process.stdout.write('echo:'+d);process.stderr.write('note');process.exit(3)})",
        ],
        cwd: '/tmp',
        input: 'hello',
      });

      expect(result).toStrictEqual({
        status: 3,
        stdout: 'echo:hello',
        stderr: 'note',
        signal: null,
      });
    });

    it('VALID: {env given} => the child sees only that env', () => {
      const result = runSyncWithInput({
        command: process.execPath,
        args: ['-e', 'process.stdout.write(String(process.env.GN10_ONLY))'],
        cwd: '/tmp',
        env: { GN10_ONLY: 'yes' },
        input: '',
      });

      expect(result).toStrictEqual({ status: 0, stdout: 'yes', stderr: '', signal: null });
    });

    it('ERROR: {command does not exist} => throws RunNotFoundError naming the command', () => {
      expect(() =>
        runSyncWithInput({
          command: 'definitely-not-a-real-command-gn10',
          args: [],
          cwd: '/tmp',
          input: '',
        }),
      ).toThrow(RunNotFoundError);
    });
  });
});
