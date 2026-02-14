import { dungeonmasterHomeFindBroker } from './dungeonmaster-home-find-broker';
import { dungeonmasterHomeFindBrokerProxy } from './dungeonmaster-home-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('dungeonmasterHomeFindBroker', () => {
  describe('resolves home path', () => {
    it('VALID: {homeDir: "/home/user"} => returns path to ~/.dungeonmaster', () => {
      const proxy = dungeonmasterHomeFindBrokerProxy();

      proxy.clearEnv();
      proxy.setupHomePath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      });

      const result = dungeonmasterHomeFindBroker();

      expect(result).toStrictEqual({ homePath: '/home/user/.dungeonmaster' });
    });

    it('VALID: {homeDir: "/root"} => returns path for root user', () => {
      const proxy = dungeonmasterHomeFindBrokerProxy();

      proxy.clearEnv();
      proxy.setupHomePath({
        homeDir: '/root',
        homePath: FilePathStub({ value: '/root/.dungeonmaster' }),
      });

      const result = dungeonmasterHomeFindBroker();

      expect(result).toStrictEqual({ homePath: '/root/.dungeonmaster' });
    });
  });

  describe('dev environment', () => {
    it('VALID: {DUNGEONMASTER_ENV: "dev"} => returns path to ~/.dungeonmaster-dev', () => {
      const proxy = dungeonmasterHomeFindBrokerProxy();

      proxy.setEnv({ key: 'DUNGEONMASTER_ENV', value: 'dev' });
      proxy.setupHomePath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster-dev' }),
      });

      const result = dungeonmasterHomeFindBroker();

      proxy.clearEnv();

      expect(result).toStrictEqual({ homePath: '/home/user/.dungeonmaster-dev' });
    });
  });
});
