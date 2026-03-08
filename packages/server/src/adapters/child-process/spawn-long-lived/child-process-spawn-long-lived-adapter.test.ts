import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { childProcessSpawnLongLivedAdapter } from './child-process-spawn-long-lived-adapter';
import { childProcessSpawnLongLivedAdapterProxy } from './child-process-spawn-long-lived-adapter.proxy';

describe('childProcessSpawnLongLivedAdapter', () => {
  describe('successful spawn', () => {
    it('VALID: {command, args, cwd} => returns kill function', () => {
      childProcessSpawnLongLivedAdapterProxy();

      const cwd = AbsoluteFilePathStub({ value: '/home/user/project' });
      const result = childProcessSpawnLongLivedAdapter({
        command: 'npx',
        args: ['vite'],
        cwd,
      });

      expect(result.kill).toStrictEqual(expect.any(Function));
    });

    it('VALID: {kill called} => delegates to child.kill', () => {
      const proxy = childProcessSpawnLongLivedAdapterProxy();

      const cwd = AbsoluteFilePathStub({ value: '/home/user/project' });
      const result = childProcessSpawnLongLivedAdapter({
        command: 'npx',
        args: ['vite'],
        cwd,
      });

      result.kill();

      expect(proxy.getKillFn()).toHaveBeenCalledWith('SIGTERM');
    });
  });
});
