/**
 * PURPOSE: Test proxy for stepResetBroker — composes child proxies for snapshot resolution,
 * state restoration, and recipe re-seeding.
 *
 * USAGE:
 * const proxy = stepResetBrokerProxy();
 * proxy.setupSnapshots({ homePath, records });
 */

import type { DirEntrySync } from '#gateway/node/fs';
import type { Guild } from '@dungeonmaster/shared/contracts';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import type { SnapshotRecord } from '../../../contracts/snapshot-record/snapshot-record-contract';
import { recipeSeedRunBrokerProxy } from '../../recipe/seed-run/recipe-seed-run-broker.proxy';
import { snapshotIndexReadBroker } from '../../snapshot/index-read/snapshot-index-read-broker';
import { snapshotIndexReadBrokerProxy } from '../../snapshot/index-read/snapshot-index-read-broker.proxy';
import { snapshotResolveBrokerProxy } from '../../snapshot/resolve/snapshot-resolve-broker.proxy';
import { resetClearStorageLayerBrokerProxy } from './reset-clear-storage-layer-broker.proxy';
import { snapshotRestoreLayerBrokerProxy } from './snapshot-restore-layer-broker.proxy';

export const stepResetBrokerProxy = (): {
  setupSnapshots: (params: {
    homePath: string;
    records: readonly SnapshotRecord[];
  }) => void;
  setupNoSnapshots: (params: { homePath: string }) => void;
  setupRestoreDirectories: (params: {
    dirs: readonly { dirPath: string; entries: readonly DirEntrySync[] }[];
  }) => void;
  setupRestoreFileStats: (params: {
    stats: readonly {
      filePath: string;
      sizeBytes: number;
      modifiedAtMs: number;
    }[];
  }) => void;
  setupRestoreFileContents: (params: {
    contents: readonly { filePath: string; content: string }[];
  }) => void;
  setupRestoreRmSucceeds: (params: { filePaths: readonly string[] }) => void;
  setupRestoreCpSucceeds: (params: {
    sourcePath: string;
    entries: readonly string[];
  }) => void;
  setupReseed: (params: {
    apiBaseUrl: string;
    guild: Guild;
    questIds: readonly string[];
  }) => void;
} => {
  // Constructed for enforce-proxy-child-creation only (step-reset-broker.ts imports
  // snapshotResolveBroker directly for its `to !== null` path) — its own internals now run through
  // the directly-mocked snapshotIndexReadBroker below, never their real fsStat/fsReadFile chain.
  snapshotResolveBrokerProxy();
  // Constructed for enforce-proxy-child-creation only — resetClearStorageLayerBroker takes an
  // already-built BrowserSession and has no adapter of its own; every scenario below builds
  // `clearStorage` directly on the `BrowserSessionStub` it hands `stepResetBroker`.
  resetClearStorageLayerBrokerProxy();
  const restoreProxy = snapshotRestoreLayerBrokerProxy();
  const recipeProxy = recipeSeedRunBrokerProxy();
  // Constructed for enforce-proxy-child-creation only — the REAL implementation is mocked directly
  // below instead, for the same reason run-execute-broker.proxy.ts mocks snapshotCaptureBroker
  // directly rather than composing its own scenario proxy: snapshotIndexReadBroker's real internals
  // reach locationsSnapshotPathsFindBroker's deliberately-unstaged, real pathJoinAdapter calls
  // (see that broker's own proxy comment), and a test combining `setupSnapshots`/`setupNoSnapshots`
  // with `setupReseed` would otherwise let `setupReseed`'s queued pathJoinAdapter one-shots (a
  // different, argument-blind mock shared process-wide) answer those calls instead of
  // recipesLocateBroker's. Mocking the broker itself sidesteps that shared queue entirely, for both
  // `snapshotResolveBroker`'s own internal call and stepResetBroker's direct one.
  snapshotIndexReadBrokerProxy();
  const indexReadHandle: MockHandle = registerMock({ fn: snapshotIndexReadBroker });

  return {
    setupSnapshots: ({ homePath, records }): void => {
      indexReadHandle.calledWith([{ homePath }]).resolves(records);
    },

    setupNoSnapshots: ({ homePath }): void => {
      indexReadHandle.calledWith([{ homePath }]).resolves([]);
    },

    setupRestoreDirectories: ({ dirs }): void => {
      restoreProxy.setupDirectories({ dirs });
    },

    setupRestoreFileStats: ({ stats }): void => {
      restoreProxy.setupFileStats({ stats });
    },

    setupRestoreFileContents: ({ contents }): void => {
      restoreProxy.setupFileContents({ contents });
    },

    setupRestoreRmSucceeds: ({ filePaths }): void => {
      restoreProxy.setupRmSucceeds({ filePaths });
    },

    setupRestoreCpSucceeds: ({ sourcePath, entries }): void => {
      restoreProxy.setupCpSucceeds({ sourcePath, entries });
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
