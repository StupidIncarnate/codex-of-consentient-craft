import { nodePtySpawnAdapter } from './node-pty-spawn-adapter';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { ScreenFrameStub } from '../../../contracts/screen-frame/screen-frame.stub';
import type { ExitCodeStub } from '../../../contracts/exit-code/exit-code.stub';

type ScreenFrame = ReturnType<typeof ScreenFrameStub>;
type ExitCode = ReturnType<typeof ExitCodeStub>;

describe('nodePtySpawnAdapter', () => {
  describe('spawning processes', () => {
    it('VALID: spawns echo process and receives output', async () => {
      const receivedData: ScreenFrame[] = [];

      const pty = nodePtySpawnAdapter({
        command: 'echo',
        args: ['hello'],
        options: { cwd: FilePathStub({ value: '/tmp' }) },
      });

      pty.onData((data) => {
        receivedData.push(ScreenFrameStub({ value: data }));
      });

      await new Promise<void>((resolve) => {
        pty.onExit(() => {
          resolve();
        });
      });

      expect(receivedData.join('').includes('hello')).toBe(true);
    });

    it('VALID: spawns process with exit code', async () => {
      const exitCodes: ExitCode[] = [];

      const pty = nodePtySpawnAdapter({
        command: 'sh',
        args: ['-c', 'exit 0'],
      });

      await new Promise<void>((resolve) => {
        pty.onExit((info) => {
          exitCodes.push(info.exitCode);
          resolve();
        });
      });

      expect(exitCodes).toStrictEqual([0]);
    });

    it('VALID: writes data to pty stdin', async () => {
      const receivedData: ScreenFrame[] = [];

      const pty = nodePtySpawnAdapter({
        command: 'cat',
        args: [],
      });

      pty.onData((data) => {
        receivedData.push(ScreenFrameStub({ value: data }));
      });

      pty.write('test input\n');

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          pty.kill();
          resolve();
        }, 100);
      });

      expect(receivedData.join('').includes('test input')).toBe(true);
    });

    it('VALID: returns process id', () => {
      const pty = nodePtySpawnAdapter({
        command: 'echo',
        args: ['hello'],
      });

      const { pid } = pty;
      pty.kill();

      expect(typeof pid).toBe('number');
      expect(pid).toBeGreaterThan(0);
    });
  });
});
