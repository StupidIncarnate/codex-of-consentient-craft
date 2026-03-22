import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamLinesAdapter } from './child-process-spawn-stream-lines-adapter';
import { childProcessSpawnStreamLinesAdapterProxy } from './child-process-spawn-stream-lines-adapter.proxy';

describe('childProcessSpawnStreamLinesAdapter', () => {
  describe('success with lines', () => {
    it('VALID: {stdout with lines} => calls onLine per line and returns accumulated output', async () => {
      const proxy = childProcessSpawnStreamLinesAdapterProxy();
      const lines: unknown[] = [];

      proxy.setupSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: ['run: 123-abc', 'lint: PASS', 'unit: FAIL'],
      });

      const result = await childProcessSpawnStreamLinesAdapter({
        command: 'dungeonmaster-ward',
        args: ['run'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        onLine: (line: string) => {
          lines.push(line);
        },
      });

      expect(lines).toStrictEqual(['run: 123-abc', 'lint: PASS', 'unit: FAIL']);
      expect(result.exitCode).toStrictEqual(ExitCodeStub({ value: 0 }));
    });
  });

  describe('failure exit code', () => {
    it('VALID: {exit code 1} => returns exit code 1', async () => {
      const proxy = childProcessSpawnStreamLinesAdapterProxy();

      proxy.setupSuccess({
        exitCode: ExitCodeStub({ value: 1 }),
        stdoutLines: ['run: 456-def'],
      });

      const result = await childProcessSpawnStreamLinesAdapter({
        command: 'dungeonmaster-ward',
        args: ['run'],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toStrictEqual(ExitCodeStub({ value: 1 }));
    });
  });

  describe('spawn args', () => {
    it('VALID: {command and args} => spawns with correct command, args, and cwd', async () => {
      const proxy = childProcessSpawnStreamLinesAdapterProxy();

      proxy.setupSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [],
      });

      await childProcessSpawnStreamLinesAdapter({
        command: 'dungeonmaster-ward',
        args: ['run', '--changed'],
        cwd: AbsoluteFilePathStub({ value: '/my/project' }),
      });

      expect(proxy.getSpawnedCommand()).toBe('dungeonmaster-ward');
      expect(proxy.getSpawnedArgs()).toStrictEqual(['run', '--changed']);
      expect(proxy.getSpawnedCwd()).toBe('/my/project');
    });
  });

  describe('error handling', () => {
    it('ERROR: {spawn error} => returns exit code 1', async () => {
      const proxy = childProcessSpawnStreamLinesAdapterProxy();

      proxy.setupError({ error: new Error('spawn failed') });

      const result = await childProcessSpawnStreamLinesAdapter({
        command: 'nonexistent',
        args: [],
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result.exitCode).toStrictEqual(ExitCodeStub({ value: 1 }));
    });
  });
});
