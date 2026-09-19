import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { recipesLocateBroker } from './recipes-locate-broker';
import { recipesLocateBrokerProxy } from './recipes-locate-broker.proxy';
import { RecipesPackageMissingError } from '../../../errors/recipes-package-missing/recipes-package-missing-error';
import { RecipesBuildMissingError } from '../../../errors/recipes-build-missing/recipes-build-missing-error';

describe('recipesLocateBroker', () => {
  describe('the package is present and built', () => {
    it('VALID: {package present, dist entry present} => returns the absolute dist entry path', async () => {
      const proxy = recipesLocateBrokerProxy();

      proxy.setupPresentAndBuilt({
        cwdPath: '/repo',
        packagePath: FilePathStub({ value: '/repo/packages/hydration-recipes' }),
        entryPath: FilePathStub({ value: '/repo/packages/hydration-recipes/dist/index.js' }),
      });

      const result = await recipesLocateBroker();

      expect(result).toStrictEqual(
        AbsoluteFilePathStub({ value: '/repo/packages/hydration-recipes/dist/index.js' }),
      );
    });
  });

  describe('the package directory is absent', () => {
    it('ERROR: {package directory absent} => throws RecipesPackageMissingError naming the path searched', async () => {
      const proxy = recipesLocateBrokerProxy();

      proxy.setupPackageMissing({
        cwdPath: '/repo',
        packagePath: FilePathStub({ value: '/repo/packages/hydration-recipes' }),
      });

      await expect(recipesLocateBroker()).rejects.toStrictEqual(
        new RecipesPackageMissingError({ packagePath: '/repo/packages/hydration-recipes' }),
      );
    });
  });

  describe('the package is present but not built', () => {
    it('ERROR: {package present, dist entry absent} => throws RecipesBuildMissingError naming the build command', async () => {
      const proxy = recipesLocateBrokerProxy();

      proxy.setupBuildMissing({
        cwdPath: '/repo',
        packagePath: FilePathStub({ value: '/repo/packages/hydration-recipes' }),
        entryPath: FilePathStub({ value: '/repo/packages/hydration-recipes/dist/index.js' }),
      });

      await expect(recipesLocateBroker()).rejects.toStrictEqual(
        new RecipesBuildMissingError({
          distPath: '/repo/packages/hydration-recipes/dist/index.js',
        }),
      );
    });
  });
});
