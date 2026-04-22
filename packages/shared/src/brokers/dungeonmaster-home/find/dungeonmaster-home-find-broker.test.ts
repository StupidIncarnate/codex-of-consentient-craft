import { dungeonmasterHomeFindBroker } from './dungeonmaster-home-find-broker';
import { dungeonmasterHomeFindBrokerProxy } from './dungeonmaster-home-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('dungeonmasterHomeFindBroker', () => {
  describe('DUNGEONMASTER_HOME unset', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster', () => {
      const proxy = dungeonmasterHomeFindBrokerProxy();

      proxy.clearHomeEnv();
      proxy.setupHomePath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      });

      const result = dungeonmasterHomeFindBroker();

      expect(result).toStrictEqual({ homePath: '/home/user/.dungeonmaster' });
    });

    it('VALID: {homeDir: "/root"} => returns /root/.dungeonmaster for root user', () => {
      const proxy = dungeonmasterHomeFindBrokerProxy();

      proxy.clearHomeEnv();
      proxy.setupHomePath({
        homeDir: '/root',
        homePath: FilePathStub({ value: '/root/.dungeonmaster' }),
      });

      const result = dungeonmasterHomeFindBroker();

      expect(result).toStrictEqual({ homePath: '/root/.dungeonmaster' });
    });
  });

  describe('DUNGEONMASTER_HOME set', () => {
    it('VALID: {DUNGEONMASTER_HOME: "/tmp/dm-test"} => returns /tmp/dm-test verbatim', () => {
      const proxy = dungeonmasterHomeFindBrokerProxy();

      proxy.setHomeEnv({ value: '/tmp/dm-test' });

      const result = dungeonmasterHomeFindBroker();

      proxy.clearHomeEnv();

      expect(result).toStrictEqual({ homePath: '/tmp/dm-test' });
    });

    it('VALID: {DUNGEONMASTER_HOME: "/workspace/.dungeonmaster-dev"} => returns it verbatim without suffix join', () => {
      const proxy = dungeonmasterHomeFindBrokerProxy();

      proxy.setHomeEnv({ value: '/workspace/.dungeonmaster-dev' });

      const result = dungeonmasterHomeFindBroker();

      proxy.clearHomeEnv();

      expect(result).toStrictEqual({ homePath: '/workspace/.dungeonmaster-dev' });
    });
  });
});
