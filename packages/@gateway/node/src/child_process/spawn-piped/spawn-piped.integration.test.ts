import { spawnPiped } from './spawn-piped';

type ExitReport = Parameters<Parameters<ReturnType<typeof spawnPiped>['onExit']>[0]>[0];

const waitForLines = async ({
  subscribe,
  count,
}: {
  subscribe: (callback: (line: string) => void) => void;
  count: number;
}): Promise<string[]> =>
  new Promise((resolve) => {
    const lines: string[] = [];
    subscribe((line) => {
      lines.push(line);
      if (lines.length === count) {
        resolve(lines);
      }
    });
  });

describe('spawnPiped()', () => {
  describe('real process', () => {
    it('VALID: {node echoes each stdin line} => a line written comes back on stdout and the exit code arrives after stdin ends', async () => {
      const child = spawnPiped({
        command: 'node',
        args: [
          '-e',
          "require('readline').createInterface({input:process.stdin}).on('line',(l)=>console.log('echo:'+l)).on('close',()=>process.exit(3))",
        ],
        cwd: '/tmp',
      });

      const stdoutLines = waitForLines({ subscribe: child.onStdoutLine, count: 2 });
      const exitReport = new Promise<ExitReport>((resolve) => {
        child.onExit(resolve);
      });
      child.writeLine('one');
      child.writeLine('two');
      child.endStdin();

      await expect(stdoutLines).resolves.toStrictEqual(['echo:one', 'echo:two']);
      await expect(exitReport).resolves.toStrictEqual({ code: 3, signal: null });
    });

    it('ERROR: {command does not exist} => onExit reports the ENOENT error instead of crashing', async () => {
      const child = spawnPiped({
        command: 'definitely-not-a-real-command-gn9',
        args: [],
        cwd: '/tmp',
      });

      const report = await new Promise<ExitReport>((resolve) => {
        child.onExit(resolve);
      });

      expect({
        code: report.code,
        signal: report.signal,
        errorCode: report.error?.code,
      }).toStrictEqual({
        code: null,
        signal: null,
        errorCode: 'ENOENT',
      });
    });
  });
});
