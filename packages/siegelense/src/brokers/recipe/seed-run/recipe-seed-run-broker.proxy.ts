/**
 * PURPOSE: Proxy for recipeSeedRunBroker — composes recipesLocateBrokerProxy and stages
 * `#gateway/node/module`'s `dynamicImport` so callers can stage recipes execution.
 *
 * USAGE:
 * const proxy = recipeSeedRunBrokerProxy();
 * proxy.bookPresent();
 * proxy.guildWithThreeQuestsAnswers({ guild, quests });
 */

import { dynamicImport } from '#gateway/node/module';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import type { FilePath, Guild, Quest } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
  bookMissingUnder: (params: { repoRoot: string }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  // dynamicImportProxy() offers no staging of its own (a language primitive, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses dynamicImport itself directly, keyed on the module specifier, the same way
  // the pre-gateway runtimeDynamicImportAdapter's own proxy self-mocked for the same reason.
  dynamicImportProxy();
  const importHandle = registerMock({ fn: dynamicImport });
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
    importHandle.calledWith([{ path: ENTRY_PATH }]).resolves(moduleExports);
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

    // `repoRoot` is the cwd the caller already answers to every reader, so the one-shot cwd this
    // queues is the same value whichever broker spends it. The real `recipesLocateBroker` throws its
    // own `RecipesPackageMissingError`.
    bookMissingUnder: ({ repoRoot }: { repoRoot: string }): void => {
      locateProxy.setupPackageMissing({
        cwdPath: repoRoot,
        packagePath: FilePathStub({
          value: `${repoRoot}/${recipesConventionStatics.package.workspaceDirName}/${recipesConventionStatics.package.dirName}`,
        }),
      });
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
