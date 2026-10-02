import { recipesLocateBroker } from './recipes-locate-broker';
import { recipesLocateBrokerProxy } from './recipes-locate-broker.proxy';
import { RecipesPackageMissingError } from '../../../errors/recipes-package-missing/recipes-package-missing-error';
import { RecipesBuildMissingError } from '../../../errors/recipes-build-missing/recipes-build-missing-error';

describe('recipesLocateBroker', () => {
  describe('the package is present and built', () => {
    it('VALID: {package present, dist entry present} => returns the absolute dist entry path', () => {
      const proxy = recipesLocateBrokerProxy();

      proxy.setupPresentAndBuilt({
        packagePath: '/repo/packages/hydration-recipes',
        entryPath: '/repo/packages/hydration-recipes/dist/index.js',
      });

      const result = recipesLocateBroker({ repoRoot: '/repo' });

      expect(result).toStrictEqual('/repo/packages/hydration-recipes/dist/index.js');
    });

    it('VALID: {repoRoot is a worktree} => locates the package under that worktree', () => {
      const proxy = recipesLocateBrokerProxy();

      proxy.setupPresentAndBuilt({
        packagePath: '/repo/worktrees/quest-a/packages/hydration-recipes',
        entryPath: '/repo/worktrees/quest-a/packages/hydration-recipes/dist/index.js',
      });

      const result = recipesLocateBroker({ repoRoot: '/repo/worktrees/quest-a' });

      expect(result).toStrictEqual(
        '/repo/worktrees/quest-a/packages/hydration-recipes/dist/index.js',
      );
    });
  });

  describe('the package directory is absent', () => {
    it('ERROR: {package directory absent} => throws RecipesPackageMissingError naming the path searched', () => {
      const proxy = recipesLocateBrokerProxy();

      proxy.setupPackageMissing({ packagePath: '/repo/packages/hydration-recipes' });

      expect(() => recipesLocateBroker({ repoRoot: '/repo' })).toThrow(
        new RecipesPackageMissingError({ packagePath: '/repo/packages/hydration-recipes' }),
      );
    });
  });

  describe('the package is present but not built', () => {
    it('ERROR: {package present, dist entry absent} => throws RecipesBuildMissingError naming the build command', () => {
      const proxy = recipesLocateBrokerProxy();

      proxy.setupBuildMissing({
        packagePath: '/repo/packages/hydration-recipes',
        entryPath: '/repo/packages/hydration-recipes/dist/index.js',
      });

      expect(() => recipesLocateBroker({ repoRoot: '/repo' })).toThrow(
        new RecipesBuildMissingError({
          distPath: '/repo/packages/hydration-recipes/dist/index.js',
        }),
      );
    });
  });
});
