import { recipesConventionStatics } from './recipes-convention-statics';

describe('recipesConventionStatics', () => {
  it('VALID: {} => holds the package directory, the dist entry and the three export names', () => {
    expect(recipesConventionStatics).toStrictEqual({
      package: {
        workspaceDirName: 'packages',
        dirName: 'hydration-recipes',
      },
      entry: {
        distRelativePath: 'dist/index.js',
      },
      exports: {
        manifest: 'recipesManifest',
        listingBuild: 'recipesListingBuildBroker',
        seedRun: 'recipesSeedRunBroker',
      },
    });
  });
});
