/**
 * PURPOSE: Test proxy for stepResetBroker — composes child proxies for snapshot resolution,
 * state restoration, and recipe re-seeding.
 *
 * USAGE:
 * const proxy = stepResetBrokerProxy();
 * proxy.setupSnapshots({ homePath, records });
 */

import type { DirEntrySync } from '#gateway/node/fs';
import type {
  AbsoluteFilePath,
  ContentText,
  FileName,
  Guild,
} from '@dungeonmaster/shared/contracts';
import { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { FileSizeBytes } from '../../../contracts/file-size-bytes/file-size-bytes-contract';
import type { SnapshotRecord } from '../../../contracts/snapshot-record/snapshot-record-contract';
import { recipeSeedRunBrokerProxy } from '../../recipe/seed-run/recipe-seed-run-broker.proxy';
import { snapshotIndexReadBroker } from '../../snapshot/index-read/snapshot-index-read-broker';
import { snapshotIndexReadBrokerProxy } from '../../snapshot/index-read/snapshot-index-read-broker.proxy';
import { snapshotResolveBrokerProxy } from '../../snapshot/resolve/snapshot-resolve-broker.proxy';
import { snapshotRestoreLayerBrokerProxy } from './snapshot-restore-layer-broker.proxy';

export const stepResetBrokerProxy = (): {
  setupSnapshots: (params: {
    homePath: AbsoluteFilePath;
    records: readonly SnapshotRecord[];
  }) => void;
  setupNoSnapshots: (params: { homePath: AbsoluteFilePath }) => void;
  setupRestoreDirectories: (params: {
    dirs: readonly { dirPath: AbsoluteFilePath; entries: readonly DirEntrySync[] }[];
  }) => void;
  setupRestoreFileStats: (params: {
    stats: readonly {
      filePath: AbsoluteFilePath;
      sizeBytes: FileSizeBytes;
      modifiedAtMs: EpochMs;
    }[];
  }) => void;
  setupRestoreFileContents: (params: {
    contents: readonly { filePath: AbsoluteFilePath; content: string }[];
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
  // Constructed for enforce-proxy-child-creation only (step-reset-broker.ts imports
  // snapshotResolveBroker directly for its `to !== null` path) — its own internals now run through
  // the directly-mocked snapshotIndexReadBroker below, never their real fsStat/fsReadFile chain.
  snapshotResolveBrokerProxy();
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
  const { snapshotIndexReadBroker: realSnapshotIndexReadBroker } = requireActual<{
    snapshotIndexReadBroker: typeof snapshotIndexReadBroker;
  }>({ module: '../../snapshot/index-read/snapshot-index-read-broker' });
  // Sticky default: a homePath THIS file never staged still reads the real index — composing this
  // proxy inside a broader tree (run-verb-layer-broker.proxy.ts builds every verb's proxy together)
  // must not break an unrelated verb's own real call into snapshotCaptureBroker, which reads the
  // same index to number its next capture.
  indexReadHandle
    .calledWith([])
    .implement(async (params: Parameters<typeof snapshotIndexReadBroker>[0]) =>
      realSnapshotIndexReadBroker(params),
    );

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
