import { ChildProcess } from 'child_process';
import { ChildProcessStub } from './child-process.stub';

describe('ChildProcessStub', () => {
  it('VALID: {} => a real ChildProcess instance with no live process behind it', () => {
    const child = ChildProcessStub();

    expect(child instanceof ChildProcess).toBe(true);
  });

  it('VALID: {} => stdout is a real, working stream a caller can read from', async () => {
    const child = ChildProcessStub();
    const dataPromise = new Promise<string>((resolve) => {
      child.stdout?.once('data', (chunk: Buffer) => {
        resolve(chunk.toString());
      });
    });

    child.stdout?.push('stdout chunk');

    await expect(dataPromise).resolves.toBe('stdout chunk');
  });

  it('VALID: {} => stderr is a real, working stream a caller can read from', async () => {
    const child = ChildProcessStub();
    const dataPromise = new Promise<string>((resolve) => {
      child.stderr?.once('data', (chunk: Buffer) => {
        resolve(chunk.toString());
      });
    });

    child.stderr?.push('stderr chunk');

    await expect(dataPromise).resolves.toBe('stderr chunk');
  });

  it('VALID: {} => stdin is a real, working stream a caller can write to', async () => {
    const child = ChildProcessStub();
    const dataPromise = new Promise<string>((resolve) => {
      child.stdin?.once('data', (chunk: Buffer) => {
        resolve(chunk.toString());
      });
    });

    child.stdin?.write('stdin chunk');

    await expect(dataPromise).resolves.toBe('stdin chunk');
  });
});
