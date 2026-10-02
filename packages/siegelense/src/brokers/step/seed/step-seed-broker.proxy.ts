/**
 * PURPOSE: Composes the recipes-locate + dynamic-import boundary `stepSeedBroker` drives TWICE per
 * successful seed — once inside `recipesReadBroker`'s own listing read, once again for this
 * broker's own import of the recipe's `recipesSeedRunBroker` export — and exposes a semantic stage
 * per export a test needs to control. The located package sits under the lane's `repoRoot`
 * (`/tmp/dm-siege-stub-repo` in `LaneSessionStub`), so one stage answers both invocations.
 *
 * USAGE:
 * const proxy = stepSeedBrokerProxy();
 * proxy.stagesListing({ listing: [RecipeListingEntryStub()] });
 * const seedRun = proxy.stagesSeedRun({ result: { guild: { id: 'g1' } } });
 * // seedRun.getCallArgs() reads back what the recipe's own seed export was called with
 */

import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { recipesLocateBrokerProxy } from '../../recipes/locate/recipes-locate-broker.proxy';
import { recipesReadBrokerProxy } from '../../recipes/read/recipes-read-broker.proxy';

const ENTRY_PATH = '/tmp/dm-siege-stub-repo/packages/hydration-recipes/dist/index.js';
const PACKAGE_PATH = '/tmp/dm-siege-stub-repo/packages/hydration-recipes';

export const stepSeedBrokerProxy = (): {
  stagesListing: (params: { listing: unknown }) => void;
  stagesSeedRun: (params: { result: unknown }) => { getCallArgs: () => readonly unknown[] };
  stagesSeedRunThrows: (params: { error: Error }) => void;
  bookPresentAt: (params: { packagePath: string }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  // Staged through dynamicImportProxy, keyed on the module specifier. It also covers
  // stepSeedBroker's own import of recipesReadBroker, the same shared mock recipesReadBrokerProxy
  // composes, so constructing that proxy here only satisfies enforce-proxy-child-creation for
  // that composition.
  const importProxy = dynamicImportProxy();
  recipesReadBrokerProxy();
  const moduleExports: Record<PropertyKey, unknown> = {};
  const state: { packagePath: string | null } = { packagePath: null };

  const stageEntry = (): void => {
    if (state.packagePath !== null) {
      const pkgPath = state.packagePath;
      const entryPath = `${state.packagePath}/${recipesConventionStatics.entry.distRelativePath}`;
      locateProxy.setupPresentAndBuilt({
        packagePath: pkgPath,
        entryPath,
      });
      importProxy.returns({ path: entryPath, module: moduleExports });
      return;
    }
    locateProxy.setupPresentAndBuilt({
      packagePath: PACKAGE_PATH,
      entryPath: ENTRY_PATH,
    });
    importProxy.returns({ path: ENTRY_PATH, module: moduleExports });
  };

  return {
    bookPresentAt: ({ packagePath }: { packagePath: string }): void => {
      state.packagePath = packagePath;
      stageEntry();
    },

    stagesListing: ({ listing }: { listing: unknown }): void => {
      stageEntry();
      moduleExports[recipesConventionStatics.exports.listing] = (): unknown => listing;
    },

    stagesSeedRun: ({ result }: { result: unknown }): { getCallArgs: () => readonly unknown[] } => {
      stageEntry();
      const seedRunMock =
        typeof result === 'function'
          ? jest.fn().mockImplementation(result as (...args: readonly unknown[]) => unknown)
          : jest.fn().mockResolvedValue(result);
      moduleExports[recipesConventionStatics.exports.seed] = seedRunMock;
      return { getCallArgs: (): readonly unknown[] => seedRunMock.mock.calls };
    },

    stagesSeedRunThrows: ({ error }: { error: Error }): void => {
      stageEntry();
      moduleExports[recipesConventionStatics.exports.seed] = jest.fn().mockRejectedValue(error);
    },
  };
};
