import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { e2eProcessPlaceholderStatics } from '../../../statics/e2e-process-placeholder/e2e-process-placeholder-statics';
import { InstallCreateConfigResponderProxy } from './install-create-config-responder.proxy';

describe('InstallCreateConfigResponder', () => {
  describe('no existing config', () => {
    it('VALID: {context: no existing config} => creates .dungeonmaster.json config', async () => {
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
        message: 'Created .dungeonmaster.json',
      });
    });

    it('VALID: {context: no existing config} => seeds the placeholder devServer.e2e.processes entry', async () => {
      const proxy = InstallCreateConfigResponderProxy();

      proxy.setupConfigNotExists();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const written = JSON.parse(String(proxy.getWrittenConfig())) as Record<PropertyKey, unknown>;
      const devServer = written.devServer as Record<PropertyKey, unknown>;

      expect(devServer.e2e).toStrictEqual({
        processes: [e2eProcessPlaceholderStatics.process],
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
        message: '.dungeonmaster.json already exists',
      });
    });
  });
});
