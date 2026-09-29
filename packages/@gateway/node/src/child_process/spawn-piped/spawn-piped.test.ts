import { spawnPiped } from './spawn-piped';
import { spawnPipedProxy } from './spawn-piped.proxy';

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
  describe('writeLine()', () => {
    it('VALID: {two lines written} => the child stdin received each line, newline-terminated, in order', () => {
      const proxy = spawnPipedProxy();
      proxy.setupChild({ command: 'worker', args: ['--fast'], cwd: '/repo' });

      const child = spawnPiped({ command: 'worker', args: ['--fast'], cwd: '/repo' });
      child.writeLine('{"a":1}');
      child.writeLine('second');

      expect(
        proxy.getWrittenLinesFor({ command: 'worker', args: ['--fast'], cwd: '/repo' }),
      ).toStrictEqual(['{"a":1}', 'second']);
    });

    it('EMPTY: {nothing written} => no lines recorded', () => {
      const proxy = spawnPipedProxy();
      proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });

      spawnPiped({ command: 'worker', args: [], cwd: '/repo' });

      expect(proxy.getWrittenLinesFor({ command: 'worker', args: [], cwd: '/repo' })).toStrictEqual(
        [],
      );
    });
  });

  describe('spawn options', () => {
    it('VALID: {env given} => spawn receives that env', () => {
      const proxy = spawnPipedProxy();
      proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });

      spawnPiped({ command: 'worker', args: [], cwd: '/repo', env: { ONLY: 'this' } });

      expect(proxy.getSpawnedEnvFor({ command: 'worker', args: [], cwd: '/repo' })).toStrictEqual({
        ONLY: 'this',
      });
    });

    it('EMPTY: {env omitted} => spawn options carry no env', () => {
      const proxy = spawnPipedProxy();
      proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });

      spawnPiped({ command: 'worker', args: [], cwd: '/repo' });

      expect(proxy.getSpawnedEnvFor({ command: 'worker', args: [], cwd: '/repo' })).toBe(undefined);
    });
  });

  describe('output lines', () => {
    it('VALID: {child prints two stdout lines} => onStdoutLine receives each without its newline', async () => {
      const proxy = spawnPipedProxy();
      const controls = proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });
      const child = spawnPiped({ command: 'worker', args: [], cwd: '/repo' });

      const received = waitForLines({ subscribe: child.onStdoutLine, count: 2 });
      controls.pushStdoutLine({ line: 'READY' });
      controls.pushStdoutLine({ line: '{"exitCode":0}' });

      await expect(received).resolves.toStrictEqual(['READY', '{"exitCode":0}']);
    });

    it('VALID: {child prints a stderr line} => onStderrLine receives it', async () => {
      const proxy = spawnPipedProxy();
      const controls = proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });
      const child = spawnPiped({ command: 'worker', args: [], cwd: '/repo' });

      const received = waitForLines({ subscribe: child.onStderrLine, count: 1 });
      controls.pushStderrLine({ line: 'warning: slow' });

      await expect(received).resolves.toStrictEqual(['warning: slow']);
    });
  });

  describe('onExit()', () => {
    it('VALID: {child exits 0} => the report carries code 0 and no signal', async () => {
      const proxy = spawnPipedProxy();
      const controls = proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });
      const child = spawnPiped({ command: 'worker', args: [], cwd: '/repo' });

      const report = new Promise((resolve) => {
        child.onExit(resolve);
      });
      controls.exit({ code: 0 });

      await expect(report).resolves.toStrictEqual({ code: 0, signal: null });
    });

    it('VALID: {listener added after the exit} => still receives the same report', async () => {
      const proxy = spawnPipedProxy();
      const controls = proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });
      const child = spawnPiped({ command: 'worker', args: [], cwd: '/repo' });

      controls.exit({ code: null, signal: 'SIGTERM' });
      const report = await new Promise((resolve) => {
        child.onExit(resolve);
      });

      expect(report).toStrictEqual({ code: null, signal: 'SIGTERM' });
    });
  });

  describe('kill()', () => {
    it('VALID: {kill called twice} => SIGTERM is sent once', () => {
      const proxy = spawnPipedProxy();
      proxy.setupChild({ command: 'worker', args: [], cwd: '/repo' });
      const child = spawnPiped({ command: 'worker', args: [], cwd: '/repo' });

      child.kill();
      child.kill();

      expect(proxy.getKillCountFor({ command: 'worker', args: [], cwd: '/repo' })).toBe(1);
    });
  });
});
