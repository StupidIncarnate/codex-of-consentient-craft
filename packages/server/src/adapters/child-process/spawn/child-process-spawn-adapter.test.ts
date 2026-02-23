import { childProcessSpawnAdapter } from './child-process-spawn-adapter';
import { childProcessSpawnAdapterProxy } from './child-process-spawn-adapter.proxy';

describe('childProcessSpawnAdapter', () => {
  describe('spawn', () => {
    it('VALID: {command, args, cwd} => returns child process', () => {
      const proxy = childProcessSpawnAdapterProxy();
      const { fakeProcess } = proxy.setupSpawn();

      const result = childProcessSpawnAdapter({
        command: 'claude',
        args: ['-p', 'hello'],
        cwd: '/project',
      });

      expect(result).toBe(fakeProcess);
    });
  });
});
