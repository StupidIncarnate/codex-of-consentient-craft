import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallCreateTsconfigResponderProxy } from './install-create-tsconfig-responder.proxy';
import { tsconfigTemplateStatics } from '../../../statics/tsconfig-template/tsconfig-template-statics';

describe('InstallCreateTsconfigResponder', () => {
  describe('no existing tsconfig.json', () => {
    it('VALID: {no tsconfig.json} => writes the base-extending tsconfig', async () => {
      const proxy = InstallCreateTsconfigResponderProxy();

      proxy.setupFileNotExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Created tsconfig.json',
      });

      const writtenFiles = proxy.getWrittenFiles();

      expect(writtenFiles[0]?.path).toBe('/project/tsconfig.json');
      expect(writtenFiles[0]?.content).toBe(tsconfigTemplateStatics.content);
    });
  });

  describe('tsconfig.json already exists', () => {
    it('VALID: {tsconfig.json present} => skips without writing', async () => {
      const proxy = InstallCreateTsconfigResponderProxy();

      proxy.setupFileExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'tsconfig.json already exists',
      });

      expect(proxy.getWrittenFiles()).toStrictEqual([]);
    });
  });
});
