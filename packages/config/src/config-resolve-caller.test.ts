// configResolveBroker is imported through the SAME specifier ('@dungeonmaster/config') the proxy
// mocks, so this test observes the exact call real external callers make.
import { configResolveBroker } from '@dungeonmaster/config';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { configResolveBrokerProxy } from './config-resolve-caller.proxy';
import { DungeonmasterConfigStub } from './contracts/dungeonmaster-config/dungeonmaster-config.stub';

describe('configResolveBrokerProxy', () => {
  describe('setupResolves()', () => {
    it('VALID: {filePath, config} => configResolveBroker resolves with the staged config', async () => {
      const proxy = configResolveBrokerProxy();
      const filePath = FilePathStub({ value: '/project/.dungeonmaster.json' });
      const config = DungeonmasterConfigStub({ framework: 'react' });

      proxy.setupResolves({ filePath, config });

      const result = await configResolveBroker({ filePath });

      expect(result).toStrictEqual(config);
    });
  });

  describe('setupConfigNotFound()', () => {
    it('ERROR: {filePath} => configResolveBroker rejects with the real ConfigNotFoundError message', async () => {
      const proxy = configResolveBrokerProxy();
      const filePath = FilePathStub({ value: '/isolated/.dungeonmaster.json' });

      proxy.setupConfigNotFound({ filePath });

      await expect(configResolveBroker({ filePath })).rejects.toThrow(
        /^No \.dungeonmaster configuration file found starting from \/isolated\/\.dungeonmaster\.json\. Searched up the directory tree but no config file was found\.$/u,
      );
    });
  });

  describe('setupConfigMalformed()', () => {
    it('ERROR: {filePath, message} => configResolveBroker rejects with the real InvalidConfigError message', async () => {
      const proxy = configResolveBrokerProxy();
      const filePath = FilePathStub({ value: '/project/.dungeonmaster.json' });

      proxy.setupConfigMalformed({ filePath, message: 'Missing required field' });

      await expect(configResolveBroker({ filePath })).rejects.toThrow(
        /^Invalid configuration in \/project\/\.dungeonmaster\.json: Missing required field$/u,
      );
    });
  });
});
