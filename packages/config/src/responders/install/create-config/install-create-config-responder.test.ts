import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallCreateConfigResponderProxy } from './install-create-config-responder.proxy';

describe('InstallCreateConfigResponder', () => {
  describe('no existing config', () => {
    it('VALID: {context: no existing config} => creates .dungeonmaster config', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupConfigNotExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'created',
        message: 'Created .dungeonmaster config',
      });
    });
  });

  describe('config already exists', () => {
    it('VALID: {context: config already exists} => skips installation', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupConfigExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'skipped',
        message: 'Config already exists',
      });
    });
  });
});
