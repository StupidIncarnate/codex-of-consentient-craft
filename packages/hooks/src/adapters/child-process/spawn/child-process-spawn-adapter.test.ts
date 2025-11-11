import { childProcessSpawnAdapter } from './child-process-spawn-adapter';
import { childProcessSpawnAdapterProxy } from './child-process-spawn-adapter.proxy';
import { ChildProcessStub } from '../../../contracts/child-process/child-process.stub';

describe('childProcessSpawnAdapter', () => {
  it('VALID: {command: "npm", args: ["test"]} => returns child process', () => {
    const proxy = childProcessSpawnAdapterProxy();
    const mockChildProcess = ChildProcessStub({ pid: 1234 });
    proxy.returns({ childProcess: mockChildProcess });

    const result = childProcessSpawnAdapter({
      command: 'npm',
      args: ['test'],
      options: { stdio: 'inherit' },
    });

    expect(result).toStrictEqual(mockChildProcess);
  });

  it('VALID: {command: "echo"} => spawns process with default args and options', () => {
    const proxy = childProcessSpawnAdapterProxy();
    const mockChildProcess = ChildProcessStub({ pid: 5678 });
    proxy.returns({ childProcess: mockChildProcess });

    const result = childProcessSpawnAdapter({
      command: 'echo',
    });

    expect(result).toStrictEqual(mockChildProcess);
  });
});
