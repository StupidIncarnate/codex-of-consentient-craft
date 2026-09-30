import { locationsEslintConfigPathFindBroker } from './locations-eslint-config-path-find-broker';
import { locationsEslintConfigPathFindBrokerProxy } from './locations-eslint-config-path-find-broker.proxy';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';

describe('locationsEslintConfigPathFindBroker', () => {
  describe('config found cases', () => {
    it('VALID: {startPath: "/project"} => returns first existing variant', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtFirstVariant({
        searchPath: '/project',
        configPath: '/project/eslint.config.ts',
      });

      const result = await locationsEslintConfigPathFindBroker({
        startPath: '/project',
      });

      expect(result).toBe('/project/eslint.config.ts');
    });

    it('VALID: {startPath: "/project"} => returns .js path when .ts variant missing', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtNonFirstVariant({
        searchPath: '/project',
        missingPaths: ['/project/eslint.config.ts'],
        configPath: '/project/eslint.config.js',
      });

      const result = await locationsEslintConfigPathFindBroker({
        startPath: '/project',
      });

      expect(result).toBe('/project/eslint.config.js');
    });

    it('VALID: {startPath: "/repo/packages/foo/src"} => walks up to parent and returns config at /repo', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtParentDirectory({
        childPaths: ['/repo/packages/foo/src', '/repo/packages/foo', '/repo/packages'],
        parentPaths: ['/repo/packages/foo', '/repo/packages', '/repo'],
        finalSearchPath: '/repo',
        parentMissingPaths: ['/repo/eslint.config.ts'],
        parentConfigPath: '/repo/eslint.config.js',
      });

      const result = await locationsEslintConfigPathFindBroker({
        startPath: '/repo/packages/foo/src',
      });

      expect(result).toBe('/repo/eslint.config.js');
    });
  });

  describe('config not found cases', () => {
    it('ERROR: {startPath: "/no-config"} => throws ProjectRootNotFoundError when nothing found and parent equals self', async () => {
      const proxy = locationsEslintConfigPathFindBrokerProxy();

      proxy.setupAllVariantsMissingThenParentNotFound({ searchPath: '/no-config' });

      await expect(
        locationsEslintConfigPathFindBroker({
          startPath: '/no-config',
        }),
      ).rejects.toThrow(ProjectRootNotFoundError);
    });
  });
});
