import { locationsEslintConfigPathFindBroker } from './locations-eslint-config-path-find-broker';
import { locationsEslintConfigPathFindBrokerProxy } from './locations-eslint-config-path-find-broker.proxy';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsEslintConfigPathFindBroker', () => {
  describe('config found cases', () => {
    it('VALID: {startPath: "/project"} => returns first existing variant', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtFirstVariant({
        searchPath: '/project',
        configPath: FilePathStub({ value: '/project/eslint.config.ts' }),
      });

      const result = await locationsEslintConfigPathFindBroker({
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/eslint.config.ts' }));
    });

    it('VALID: {startPath: "/project"} => returns .js path when .ts variant missing', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtNonFirstVariant({
        searchPath: '/project',
        missingPaths: [FilePathStub({ value: '/project/eslint.config.ts' })],
        configPath: FilePathStub({ value: '/project/eslint.config.js' }),
      });

      const result = await locationsEslintConfigPathFindBroker({
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/eslint.config.js' }));
    });

    it('VALID: {startPath: "/repo/packages/foo/src"} => walks up to parent and returns config at /repo', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtParentDirectory({
        childPaths: ['/repo/packages/foo/src', '/repo/packages/foo', '/repo/packages'],
        parentPaths: ['/repo/packages/foo', '/repo/packages', '/repo'],
        parentMissingPaths: [FilePathStub({ value: '/repo/eslint.config.ts' })],
        parentConfigPath: FilePathStub({ value: '/repo/eslint.config.js' }),
      });

      const result = await locationsEslintConfigPathFindBroker({
        startPath: FilePathStub({ value: '/repo/packages/foo/src' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/repo/eslint.config.js' }));
    });
  });

  describe('config not found cases', () => {
    it('ERROR: {startPath: "/no-config"} => throws ProjectRootNotFoundError when nothing found and parent equals self', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupAllVariantsMissingThenParentNotFound({ searchPath: '/no-config' });

      await expect(
        locationsEslintConfigPathFindBroker({
          startPath: FilePathStub({ value: '/no-config' }),
        }),
      ).rejects.toThrow(ProjectRootNotFoundError);
    });
  });
});
