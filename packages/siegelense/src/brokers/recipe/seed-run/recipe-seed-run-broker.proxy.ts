/**
 * PURPOSE: Proxy for recipeSeedRunBroker — composes recipesLocateBrokerProxy and
 * runtimeDynamicImportAdapterProxy so callers can stage recipes execution.
 *
 * USAGE:
 * const proxy = recipeSeedRunBrokerProxy();
 * proxy.bookPresent();
 * proxy.guildLaneAnswers({ ... });
 */

import type { ContentText, FilePath, Guild } from '@dungeonmaster/shared/contracts';
import { ContentTextStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';

import { SeedResultStub } from '../../../contracts/seed-result/seed-result.stub';
import type { SeedResult } from '../../../contracts/seed-result/seed-result-contract';
import { recipesLocateBrokerProxy } from '../../recipes/locate/recipes-locate-broker.proxy';

const ENTRY_PATH: FilePath = FilePathStub({
  value: '/repo/packages/hydration-recipes/dist/index.js',
});
const PACKAGE_PATH: FilePath = FilePathStub({ value: '/repo/packages/hydration-recipes' });

export const recipeSeedRunBrokerProxy = (): {
  bookPresent: () => void;
  bookPresentAt: (params: { packagePath: string }) => void;
  bookMissing: () => void;
  guildLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: Guild;
    questIds: readonly ContentText[];
  }) => void;
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

    guildLaneAnswers: ({
      apiBaseUrl: _apiBaseUrl,
      guild,
      questIds,
    }: {
      apiBaseUrl: ContentText;
      guild: Guild;
      questIds: readonly ContentText[];
    }): void => {
      stageEntry();
      const firstQuestId =
        questIds[0] ?? ContentTextStub({ value: 'bbbbbbbb-2222-4222-8222-222222222222' });
      const result: SeedResult = SeedResultStub({
        guildId: guild.id,
        guildSlug: ContentTextStub({ value: guild.urlSlug ?? 'siege-guild' }),
        questId: firstQuestId,
      });
      moduleExports[recipesConventionStatics.exports.seedRun] = jest.fn().mockResolvedValue(result);
    },
  };
};
