/**
 * PURPOSE: Proxy for recipeSeedRunBroker — composes recipesLocateBrokerProxy and
 * runtimeDynamicImportAdapterProxy so callers can stage recipes execution.
 *
 * USAGE:
 * const proxy = recipeSeedRunBrokerProxy();
 * proxy.bookPresent();
 * proxy.guildWithThreeQuestsAnswers({ guild, quests });
 */

import type { FilePath, Guild, Quest } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';

import { SeedResultStub } from '../../../contracts/seed-result/seed-result.stub';
import { recipesLocateBrokerProxy } from '../../recipes/locate/recipes-locate-broker.proxy';

type SeedResult = ReturnType<typeof SeedResultStub>;

const ENTRY_PATH: FilePath = FilePathStub({
  value: '/repo/packages/hydration-recipes/dist/index.js',
});
const PACKAGE_PATH: FilePath = FilePathStub({ value: '/repo/packages/hydration-recipes' });

export const recipeSeedRunBrokerProxy = (): {
  bookPresent: () => void;
  bookPresentAt: (params: { packagePath: string }) => void;
  bookMissing: () => void;
  guildWithThreeQuestsAnswers: (params: {
    guild: Guild;
    questCreated: Quest;
    questInProgress: Quest;
    questComplete: Quest;
  }) => void;
  malformedAnswer: () => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  const importProxy = runtimeDynamicImportAdapterProxy();
  const moduleExports: Record<PropertyKey, unknown> = {};

  const stageEntry = (): void => {
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
    bookPresent: (): void => {
      stageEntry();
    },

    bookPresentAt: ({ packagePath: _packagePath }: { packagePath: string }): void => {
      stageEntry();
    },

    bookMissing: (): void => {
      locateProxy.setupPackageMissing({ cwdPath: '/repo', packagePath: PACKAGE_PATH });
    },

    // Shaped like `dmRegistryBroker.run`'s own real return for `guild-with-three-quests` — the
    // FULL saved row under each `saveRecordAs` name, never a flattened id (see
    // recipes-guild-with-three-quests-broker.integration.test.ts, the real producer this fakes).
    guildWithThreeQuestsAnswers: ({
      guild,
      questCreated,
      questInProgress,
      questComplete,
    }: {
      guild: Guild;
      questCreated: Quest;
      questInProgress: Quest;
      questComplete: Quest;
    }): void => {
      stageEntry();
      const result: SeedResult = SeedResultStub({
        guild,
        questCreated,
        questInProgress,
        questComplete,
      });
      moduleExports[recipesConventionStatics.exports.seed] = jest.fn().mockResolvedValue(result);
    },

    // Neither a ContentText nor a saved-row record — fails BOTH branches of `seedResultContract`'s
    // union, for the error-surface case: a shape neither this fixture nor any real recipe produces.
    malformedAnswer: (): void => {
      stageEntry();
      moduleExports[recipesConventionStatics.exports.seed] = jest
        .fn()
        .mockResolvedValue({ guild: 123 });
    },
  };
};
