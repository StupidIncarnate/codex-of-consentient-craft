import { locationsHookConfigPathFindBroker } from './locations-hook-config-path-find-broker';
import { locationsHookConfigPathFindBrokerProxy } from './locations-hook-config-path-find-broker.proxy';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsHookConfigPathFindBroker', () => {
  describe('config found cases', () => {
    it('VALID: {startPath: "/project"} => returns first existing variant', async () => {
      const proxy = locationsHookConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtFirstVariant({
        configPath: FilePathStub({ value: '/project/.dungeonmaster-hooks.config.ts' }),
      });

      const result = await locationsHookConfigPathFindBroker({
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/project/.dungeonmaster-hooks.config.ts' }),
      );
    });

    it('VALID: {startPath: "/project", first variant missing} => returns later matching variant', async () => {
      const proxy = locationsHookConfigPathFindBrokerProxy();

      proxy.setupConfigFoundAtLaterVariant({
        searchPath: '/project',
        matchingVariant: '.mjs',
      });

      const result = await locationsHookConfigPathFindBroker({
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/project/.dungeonmaster-hooks.config.mjs' }),
      );
    });

    it('VALID: {startPath: "/project/src/nested", config in ancestor} => walks up and returns ancestor path', async () => {
      const proxy = locationsHookConfigPathFindBrokerProxy();

      proxy.setupConfigFoundInAncestor({
        startPath: '/project/src/nested',
        ancestorPath: '/project/src',
      });

      const result = await locationsHookConfigPathFindBroker({
        startPath: FilePathStub({ value: '/project/src/nested' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/project/src/.dungeonmaster-hooks.config.ts' }),
      );
    });
  });

  describe('config not found cases', () => {
    it('ERROR: {startPath: "/no-config"} => throws ProjectRootNotFoundError', async () => {
      const proxy = locationsHookConfigPathFindBrokerProxy();

      proxy.setupAllVariantsMissingThenParentNotFound({ searchPath: '/no-config' });

      await expect(
        locationsHookConfigPathFindBroker({
          startPath: FilePathStub({ value: '/no-config' }),
        }),
      ).rejects.toThrow(ProjectRootNotFoundError);
    });
  });
});
