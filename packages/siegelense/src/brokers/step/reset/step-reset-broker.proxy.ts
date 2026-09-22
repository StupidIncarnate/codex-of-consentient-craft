/**
 * PURPOSE: Test proxy for stepResetBroker — composes child proxies for snapshot resolution,
 * state restoration, and recipe re-seeding.
 *
 * USAGE:
 * const proxy = stepResetBrokerProxy();
 * proxy.setupSnapshots({ homePath, records });
 */

import type { fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import type {
  AbsoluteFilePath,
  ContentText,
  FileName,
  Guild,
} from '@dungeonmaster/shared/contracts';
import { QuestStub } from '@dungeonmaster/shared/contracts';

import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { FileSizeBytes } from '../../../contracts/file-size-bytes/file-size-bytes-contract';
import type { SnapshotRecord } from '../../../contracts/snapshot-record/snapshot-record-contract';
import { recipeSeedRunBrokerProxy } from '../../recipe/seed-run/recipe-seed-run-broker.proxy';
import { snapshotResolveBrokerProxy } from '../../snapshot/resolve/snapshot-resolve-broker.proxy';
import { snapshotRestoreLayerBrokerProxy } from './snapshot-restore-layer-broker.proxy';

type Dirent = ReturnType<typeof fsReaddirWithTypesAdapter>[0];

export const stepResetBrokerProxy = (): {
  setupSnapshots: (params: {
    homePath: AbsoluteFilePath;
    records: readonly SnapshotRecord[];
  }) => void;
  setupNoSnapshots: (params: { homePath: AbsoluteFilePath }) => void;
  setupRestoreDirectories: (params: {
    dirs: readonly { dirPath: AbsoluteFilePath; entries: readonly Dirent[] }[];
  }) => void;
  setupRestoreFileStats: (params: {
    stats: readonly {
      filePath: AbsoluteFilePath;
      sizeBytes: FileSizeBytes;
      modifiedAtMs: EpochMs;
    }[];
  }) => void;
  setupRestoreRmSucceeds: (params: { filePaths: readonly AbsoluteFilePath[] }) => void;
  setupRestoreCpSucceeds: (params: {
    sourcePath: AbsoluteFilePath;
    destinationPath: AbsoluteFilePath;
    entries: readonly FileName[];
  }) => void;
  setupReseed: (params: {
    apiBaseUrl: ContentText;
    guild: Guild;
    questIds: readonly ContentText[];
  }) => void;
} => {
  const resolveProxy = snapshotResolveBrokerProxy();
  const restoreProxy = snapshotRestoreLayerBrokerProxy();
  const recipeProxy = recipeSeedRunBrokerProxy();

  return {
    setupSnapshots: ({ homePath, records }): void => {
      resolveProxy.setupStoreHolding({ homePath, records });
    },

    setupNoSnapshots: ({ homePath }): void => {
      resolveProxy.setupNoStore({ homePath });
    },

    setupRestoreDirectories: ({ dirs }): void => {
      restoreProxy.setupDirectories({ dirs });
    },

    setupRestoreFileStats: ({ stats }): void => {
      restoreProxy.setupFileStats({ stats });
    },

    setupRestoreRmSucceeds: ({ filePaths }): void => {
      restoreProxy.setupRmSucceeds({ filePaths });
    },

    setupRestoreCpSucceeds: ({ sourcePath, destinationPath, entries }): void => {
      restoreProxy.setupCpSucceeds({ sourcePath, destinationPath, entries });
    },

    // `apiBaseUrl` stays in this method's own signature to match the real seam
    // (`recipeSeedRunBroker` still takes one), even though the staged recipe answer no longer
    // reads it — `guildWithThreeQuestsAnswers` stages the FULL saved rows the real
    // `guild-with-three-quests` recipe produces, never the flat ids DEF-16 fixed.
    setupReseed: ({ apiBaseUrl: _apiBaseUrl, guild, questIds }): void => {
      recipeProxy.bookPresent();
      const [firstId, secondId, thirdId] = questIds;
      recipeProxy.guildWithThreeQuestsAnswers({
        guild,
        questCreated: firstId === undefined ? QuestStub() : QuestStub({ id: firstId }),
        questInProgress: secondId === undefined ? QuestStub() : QuestStub({ id: secondId }),
        questComplete: thirdId === undefined ? QuestStub() : QuestStub({ id: thirdId }),
      });
    },
  };
};
