import { childProcessSpawnAdapter } from './child-process-spawn-adapter';
import { childProcessSpawnAdapterProxy } from './child-process-spawn-adapter.proxy';

describe('childProcessSpawnAdapter', () => {
  it('VALID: {echo command} => spawns process and returns ChildProcess', () => {
    childProcessSpawnAdapterProxy();

    const child = childProcessSpawnAdapter({
      command: 'echo',
      args: ['hello'],
    });
    const { pid } = child;
    child.kill();

    expect(pid).toBeDefined();
  });

  it('VALID: {with options} => spawns process with options', () => {
    childProcessSpawnAdapterProxy();

    const child = childProcessSpawnAdapter({
      command: 'echo',
      args: ['hello'],
      options: { stdio: 'pipe' },
    });
    const { pid } = child;
    const hasStdout = child.stdout !== null;
    child.kill();

    expect(pid).toBeDefined();
    expect(hasStdout).toBe(true);
  });
});
