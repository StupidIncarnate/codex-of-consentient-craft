import { ChildProcess } from 'child_process';
import { SpawnStreamJsonResultStub } from './spawn-stream-json-result.stub';

describe('SpawnStreamJsonResultStub', () => {
  it('VALID: {} => a real ChildProcess with a working stdout stream', () => {
    const result = SpawnStreamJsonResultStub();

    expect(result.process instanceof ChildProcess).toBe(true);
    expect(result.stdout).toBe(result.process.stdout);
  });

  it('VALID: {} => stdout is a real, readable stream a caller can read from', async () => {
    const result = SpawnStreamJsonResultStub();
    const dataPromise = new Promise<string>((resolve) => {
      result.stdout.once('data', (chunk: Buffer) => {
        resolve(chunk.toString());
      });
    });

    result.stdout.push('{"type":"assistant"}\n');

    await expect(dataPromise).resolves.toBe('{"type":"assistant"}\n');
  });
});
