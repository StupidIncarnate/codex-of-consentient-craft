import { dungeonmasterHomeEnsureBroker } from './dungeonmaster-home-ensure-broker';
import { dungeonmasterHomeEnsureBrokerProxy } from './dungeonmaster-home-ensure-broker.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('dungeonmasterHomeEnsureBroker', () => {
  describe('successful ensure', () => {
    it('VALID: {homeDir: "/home/user"} => creates both directories and returns paths', async () => {
      const proxy = dungeonmasterHomeEnsureBrokerProxy();

      proxy.setupEnsureSuccess({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
      });

      const result = await dungeonmasterHomeEnsureBroker();

      expect(result).toStrictEqual({
        homePath: '/home/user/.dungeonmaster',
        guildsPath: '/home/user/.dungeonmaster/guilds',
      });
    });

    it('VALID: {homeDir: "/root"} => creates directories for root user', async () => {
      const proxy = dungeonmasterHomeEnsureBrokerProxy();

      proxy.setupEnsureSuccess({
        homeDir: '/root',
        homePath: FilePathStub({ value: '/root/.dungeonmaster' }),
        guildsPath: FilePathStub({ value: '/root/.dungeonmaster/guilds' }),
      });

      const result = await dungeonmasterHomeEnsureBroker();

      expect(result).toStrictEqual({
        homePath: '/root/.dungeonmaster',
        guildsPath: '/root/.dungeonmaster/guilds',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {mkdir fails} => throws permission error', async () => {
      const proxy = dungeonmasterHomeEnsureBrokerProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/home/user/.dungeonmaster' });

      proxy.setupMkdirFails({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        error,
      });

      await expect(dungeonmasterHomeEnsureBroker()).rejects.toBe(error);
    });
  });
});
