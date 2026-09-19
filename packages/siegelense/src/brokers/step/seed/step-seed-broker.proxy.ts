/**
 * PURPOSE: Composes the recipes-locate + dynamic-import boundary `stepSeedBroker` drives TWICE per
 * successful seed — once inside `recipesReadBroker`'s own listing read, once again for this
 * broker's own import of the recipe's `recipesSeedRunBroker` export — and exposes a semantic stage
 * per export a test needs to control. `processCwdAdapter`/`pathJoinAdapter` are ONE-SHOT mocks
 * (`recipes-locate-broker.proxy.ts`'s own `setupPresentAndBuilt` queues one answer per call), so
 * `stageEntry` re-stages the SAME resolution twice — enough for both real invocations a successful
 * seed makes, and harmless surplus for a scenario that only reaches the first.
 *
 * USAGE:
 * const proxy = stepSeedBrokerProxy();
 * proxy.stagesListing({ listing: [RecipeListingEntryStub()] });
 * const seedRun = proxy.stagesSeedRun({ result: { guild: { id: 'g1' } } });
 * // seedRun.getCallArgs() reads back what the recipe's own seed export was called with
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';

import { recipesLocateBrokerProxy } from '../../recipes/locate/recipes-locate-broker.proxy';
import { recipesReadBrokerProxy } from '../../recipes/read/recipes-read-broker.proxy';

const ENTRY_PATH: FilePath = FilePathStub({
  value: '/repo/packages/siegelense-recipes/dist/index.js',
});
const PACKAGE_PATH: FilePath = FilePathStub({ value: '/repo/packages/siegelense-recipes' });

export const stepSeedBrokerProxy = (): {
  stagesListing: (params: { listing: unknown }) => void;
  stagesSeedRun: (params: { result: unknown }) => { getCallArgs: () => readonly unknown[] };
  stagesSeedRunThrows: (params: { error: Error }) => void;
  bookPresentAt: (params: { packagePath: FilePath }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  const importProxy = runtimeDynamicImportAdapterProxy();
  // Unaddressed further — this proxy stages recipesLocateBroker/runtimeDynamicImportAdapter
  // itself, the same shared mocks recipesReadBrokerProxy composes, so constructing it here only
  // satisfies enforce-proxy-child-creation for stepSeedBroker's own import of recipesReadBroker.
  recipesReadBrokerProxy();
  const moduleExports: Record<PropertyKey, unknown> = {};
  const state: { packagePath: FilePath | null } = { packagePath: null };

  const stageEntry = (): void => {
    if (state.packagePath !== null) {
      const pkgPath = state.packagePath;
      const entryPath = FilePathStub({
        value: `${state.packagePath}/${recipesConventionStatics.entry.distRelativePath}`,
      });
      locateProxy.setupPresentAndBuiltAt({
        packagePath: pkgPath,
        entryPath,
      });
      importProxy.succeeds({ path: entryPath, module: moduleExports });
      return;
    }
    locateProxy.setupPresentAndBuilt({
      cwdPath: '/repo',
      packagePath: PACKAGE_PATH,
      entryPath: ENTRY_PATH,
    });
    locateProxy.setupPresentAndBuilt({
      cwdPath: '/repo',
      packagePath: PACKAGE_PATH,
      entryPath: ENTRY_PATH,
    });
    importProxy.succeeds({ path: ENTRY_PATH, module: moduleExports });
  };

  return {
    bookPresentAt: ({ packagePath }: { packagePath: FilePath }): void => {
      state.packagePath = packagePath;
      stageEntry();
    },

    stagesListing: ({ listing }: { listing: unknown }): void => {
      stageEntry();
      moduleExports[recipesConventionStatics.exports.listingBuild] = (): unknown => listing;
    },

    stagesSeedRun: ({ result }: { result: unknown }): { getCallArgs: () => readonly unknown[] } => {
      stageEntry();
      const seedRunMock = jest.fn().mockResolvedValue(result);
      moduleExports[recipesConventionStatics.exports.seedRun] = seedRunMock;
      return { getCallArgs: (): readonly unknown[] => seedRunMock.mock.calls };
    },

    stagesSeedRunThrows: ({ error }: { error: Error }): void => {
      stageEntry();
      moduleExports[recipesConventionStatics.exports.seedRun] = jest.fn().mockRejectedValue(error);
    },
  };
};
