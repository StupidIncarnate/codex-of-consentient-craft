import { childProcessSpawnAdapter } from './child-process-spawn-adapter';
import { childProcessSpawnAdapterProxy } from './child-process-spawn-adapter.proxy';
import type { ChildProcess } from 'child_process';

describe('childProcessSpawnAdapter', () => {
  it('should spawn process with command and args', () => {
    const mockChildProcess = {} as ChildProcess;
    childProcessSpawnAdapterProxy.mockReturnValue(mockChildProcess);

    const result = childProcessSpawnAdapter({
      command: 'npm',
      args: ['test'],
      options: { stdio: 'inherit' },
    });

    expect(result).toBe(mockChildProcess);
    expect(childProcessSpawnAdapterProxy).toHaveBeenCalledWith({
      command: 'npm',
      args: ['test'],
      options: { stdio: 'inherit' },
    });
  });

  it('should spawn process with default args and options', () => {
    const mockChildProcess = {} as ChildProcess;
    childProcessSpawnAdapterProxy.mockReturnValue(mockChildProcess);

    const result = childProcessSpawnAdapter({
      command: 'echo',
    });

    expect(result).toBe(mockChildProcess);
    expect(childProcessSpawnAdapterProxy).toHaveBeenCalledWith({
      command: 'echo',
      args: [],
      options: {},
    });
  });
});
