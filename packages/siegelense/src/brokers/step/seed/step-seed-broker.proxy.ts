/**
 * PURPOSE: Composes the recipes-locate + dynamic-import boundary `stepSeedBroker` drives TWICE per
 * successful seed — once inside `recipesReadBroker`'s own listing read, once again for this
 * broker's own import of the recipe's `recipesSeedRunBroker` export — and exposes a semantic stage
 * per export a test needs to control. `#gateway/node/process`'s `cwd` is a ONE-SHOT mock there
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

import { dynamicImport } from '#gateway/node/module';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { recipesLocateBrokerProxy } from '../../recipes/locate/recipes-locate-broker.proxy';
import { recipesReadBrokerProxy } from '../../recipes/read/recipes-read-broker.proxy';

const ENTRY_PATH: FilePath = FilePathStub({
  value: '/repo/packages/hydration-recipes/dist/index.js',
});
const PACKAGE_PATH: FilePath = FilePathStub({ value: '/repo/packages/hydration-recipes' });

const LOCATE_REPEAT_COUNT = 8;

export const stepSeedBrokerProxy = (): {
  stagesListing: (params: { listing: unknown }) => void;
  stagesSeedRun: (params: { result: unknown }) => { getCallArgs: () => readonly unknown[] };
  stagesSeedRunThrows: (params: { error: Error }) => void;
  bookPresentAt: (params: { packagePath: FilePath }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  // dynamicImportProxy() offers no staging of its own (a language primitive, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses dynamicImport itself directly, keyed on the module specifier. It also
  // covers stepSeedBroker's own import of recipesReadBroker, the same shared mock
  // recipesReadBrokerProxy composes, so constructing that proxy here only satisfies
  // enforce-proxy-child-creation for that composition.
  dynamicImportProxy();
  const importHandle = registerMock({ fn: dynamicImport });
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
      importHandle.calledWith([{ path: entryPath }]).resolves(moduleExports);
      return;
    }
    Array.from({ length: LOCATE_REPEAT_COUNT }).forEach(() => {
      locateProxy.setupPresentAndBuilt({
        cwdPath: '/repo',
        packagePath: PACKAGE_PATH,
        entryPath: ENTRY_PATH,
      });
    });
    importHandle.calledWith([{ path: ENTRY_PATH }]).resolves(moduleExports);
  };

  return {
    bookPresentAt: ({ packagePath }: { packagePath: FilePath }): void => {
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
