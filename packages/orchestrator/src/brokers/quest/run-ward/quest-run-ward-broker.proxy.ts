/**
 * PURPOSE: Proxy for questRunWardBroker — mocks ONLY the child-process and fs adapter boundaries
 *   and backs them with a virtual quest-file store, so the real questModifyBroker /
 *   questOperationsUpdateBroker / questAdvanceBroker / questBlockOnFailureBroker chain reads every
 *   prior persist (advance sees the operations the red-path splice just appended).
 *
 * USAGE:
 * const proxy = questRunWardBrokerProxy();
 * proxy.setupQuest({ quest });
 * proxy.wardExits({ exitCode: ExitCodeStub({ value: 0 }), runId, detailJson: '{"checks":[]}' });
 * await questRunWardBroker({ questId, workItemId, mode: 'changed' });
 * expect(proxy.getPersistedQuest().workItems).toStrictEqual([...]);
 */

import { Dirent } from 'fs';

import {
  childProcessSpawnCaptureAdapter,
  childProcessSpawnStreamLinesAdapter,
  fsMkdirAdapter,
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
  processCwdAdapter,
} from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import {
  childProcessSpawnStreamLinesAdapterProxy,
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  adapterResultContract,
  ErrorMessageStub,
  ExitCodeStub,
  fileContentsContract,
  fileNameContract,
  filePathContract,
  questContract,
  type ErrorMessage,
  type ExitCode,
  type FileContents,
  type FileName,
  type FilePath,
  type Quest,
  type QuestStub,
} from '@dungeonmaster/shared/contracts';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { wardDetailBrokerProxy } from '../../ward/detail/ward-detail-broker.proxy';
import { questAdvanceBrokerProxy } from '../advance/quest-advance-broker.proxy';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';

// Module-level mocks (hoisted as jest.mock by the AST transformer). Adapter-level mocking is
// deliberate: routing is registry-global, so the fs virtual store below serves EVERY broker in the
// chain (find-quest-path scan, quest load, atomic persist, ward detail write) regardless of which
// async tick the call lands on. The two shared barrels use EXPLICIT factories (factory wins the
// transformer's mock merge) so unrelated registerMock calls collected from the shared testing
// barrel cannot downgrade these to selective mocks that leave pathJoinAdapter & co real.
registerModuleMock({
  module: '@dungeonmaster/shared/adapters',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/adapters'),
    childProcessSpawnCaptureAdapter: jest.fn(),
    childProcessSpawnStreamLinesAdapter: jest.fn(),
    fsMkdirAdapter: jest.fn(),
    fsReaddirWithTypesAdapter: jest.fn(),
    pathJoinAdapter: jest.fn(),
    processCwdAdapter: jest.fn(),
  }),
});
registerModuleMock({
  module: '@dungeonmaster/shared/brokers',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/brokers'),
    dungeonmasterHomeFindBroker: jest.fn(),
  }),
});
registerModuleMock({ module: '../../../adapters/fs/append-file/fs-append-file-adapter' });
registerModuleMock({ module: '../../../adapters/fs/read-file/fs-read-file-adapter' });
registerModuleMock({ module: '../../../adapters/fs/rename/fs-rename-adapter' });
registerModuleMock({ module: '../../../adapters/fs/write-file/fs-write-file-adapter' });

type QuestInput = ReturnType<typeof QuestStub>;

const HOME_PATH = '/home/testuser/.dungeonmaster';
const GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const GUILDS_DIR = `${HOME_PATH}/guilds`;
const QUESTS_DIR = `${GUILDS_DIR}/${GUILD_ID}/quests`;

const FIXED_WARD_RESULT_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const UUID_SUFFIX_WIDTH = 2;

export const questRunWardBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  wardExits: (params: { exitCode: ExitCode; runId: FileName; detailJson: FileContents }) => void;
  wardExitsWithoutRunId: (params: { exitCode: ExitCode }) => void;
  getPersistedQuest: () => Quest;
  getSpawnedWardArgs: () => unknown;
  getDetailWrites: () => readonly { path: unknown; contents: unknown }[];
  getMkdirPaths: () => readonly unknown[];
} => {
  // Child proxies for every adapter/broker the implementation imports. Their npm-level queue
  // mocks are inert here — the fs/child-process ADAPTER modules themselves are automocked above
  // with the virtual-store implementations below. Two are load-bearing: questModifyBrokerProxy
  // re-applies the REAL questModifyBroker implementation over its module automock, and
  // questBlockOnFailureBrokerProxy is switched to passthrough so the at-budget red chain
  // exercises the real block flow.
  childProcessSpawnStreamLinesAdapterProxy();
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  processCwdAdapterProxy();
  fsWriteFileAdapterProxy();
  wardDetailBrokerProxy();
  questAdvanceBrokerProxy();
  questFindQuestPathBrokerProxy();
  questModifyBrokerProxy();
  questOperationsUpdateBrokerProxy();
  const blockProxy = questBlockOnFailureBrokerProxy();
  blockProxy.setupPassthrough();

  // Virtual filesystem: quest.json (and the ward detail blob) live here. Persist writes land in
  // the store, so the next broker's load reads the MUTATED quest — read-follows-write, exactly
  // like disk.
  const files = new Map<FilePath, FileContents>();
  const dirs = new Map<FilePath, FileName[]>();
  const mkdirPaths: unknown[] = [];
  const wardRuns: { exitCode: ExitCode; output: ErrorMessage }[] = [];
  const detailRuns: { exitCode: ExitCode; output: ErrorMessage }[] = [];
  const questFilePathRef = { value: filePathContract.parse('/unset/quest.json') };

  (pathJoinAdapter as jest.MockedFunction<typeof pathJoinAdapter>).mockImplementation(({ paths }) =>
    filePathContract.parse(paths.join('/')),
  );

  (processCwdAdapter as jest.MockedFunction<typeof processCwdAdapter>).mockImplementation(() =>
    filePathContract.parse('/project'),
  );

  (
    dungeonmasterHomeFindBroker as jest.MockedFunction<typeof dungeonmasterHomeFindBroker>
  ).mockImplementation(() => ({ homePath: filePathContract.parse(HOME_PATH) }));

  (
    fsReaddirWithTypesAdapter as jest.MockedFunction<typeof fsReaddirWithTypesAdapter>
  ).mockImplementation(({ dirPath }) =>
    (dirs.get(filePathContract.parse(String(dirPath))) ?? []).map((name) =>
      Object.assign(Object.create(Dirent.prototype) as Dirent, {
        name,
        isDirectory: (): boolean => true,
      }),
    ),
  );

  (fsReadFileAdapter as jest.MockedFunction<typeof fsReadFileAdapter>).mockImplementation(
    async ({ filePath }) => {
      const contents = files.get(filePathContract.parse(String(filePath)));
      if (contents === undefined) {
        return Promise.reject(new Error(`Failed to read file at ${String(filePath)}`));
      }
      return Promise.resolve(contents);
    },
  );

  (fsWriteFileAdapter as jest.MockedFunction<typeof fsWriteFileAdapter>).mockImplementation(
    async ({ filePath, contents }) => {
      files.set(
        filePathContract.parse(String(filePath)),
        fileContentsContract.parse(String(contents)),
      );
      return Promise.resolve(adapterResultContract.parse({ success: true }));
    },
  );

  (fsRenameAdapter as jest.MockedFunction<typeof fsRenameAdapter>).mockImplementation(
    async ({ from, to }) => {
      const fromPath = filePathContract.parse(String(from));
      const contents = files.get(fromPath);
      files.delete(fromPath);
      if (contents !== undefined) {
        files.set(filePathContract.parse(String(to)), contents);
      }
      return Promise.resolve(adapterResultContract.parse({ success: true }));
    },
  );

  (fsAppendFileAdapter as jest.MockedFunction<typeof fsAppendFileAdapter>).mockImplementation(
    async () => Promise.resolve(adapterResultContract.parse({ success: true })),
  );

  (fsMkdirAdapter as jest.MockedFunction<typeof fsMkdirAdapter>).mockImplementation(
    async ({ filepath }) => {
      mkdirPaths.push(String(filepath));
      return Promise.resolve(adapterResultContract.parse({ success: true }));
    },
  );

  // Ward spawn (childProcessSpawnStreamLinesAdapter) and ward-detail fetch
  // (wardDetailBroker → childProcessSpawnCaptureAdapter) are queued per test via wardExits*.
  (
    childProcessSpawnStreamLinesAdapter as jest.MockedFunction<
      typeof childProcessSpawnStreamLinesAdapter
    >
  ).mockImplementation(async () => {
    const next = wardRuns.shift();
    if (next === undefined) {
      return Promise.reject(new Error('questRunWardBrokerProxy: no ward spawn result queued'));
    }
    return Promise.resolve(next);
  });

  (
    childProcessSpawnCaptureAdapter as jest.MockedFunction<typeof childProcessSpawnCaptureAdapter>
  ).mockImplementation(async () => {
    const next = detailRuns.shift();
    if (next === undefined) {
      return Promise.resolve({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: '' }),
      });
    }
    return Promise.resolve(next);
  });

  // Pin crypto.randomUUID + Date.prototype.toISOString so persisted ids and timestamps are
  // deterministic. Call #0 is always the wardResultId; every later call (spiritmender op id,
  // ward-continuation op id, advance's new work-item id) gets a distinct sequenced UUID.
  const uuidCounter = { value: 0 };
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  uuidSpy.mockImplementation(((): ReturnType<typeof crypto.randomUUID> => {
    const index = uuidCounter.value;
    uuidCounter.value += 1;
    const value =
      index === 0
        ? FIXED_WARD_RESULT_UUID
        : `f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0${String(index).padStart(UUID_SUFFIX_WIDTH, '0')}`;
    return value as ReturnType<typeof crypto.randomUUID>;
  }) as typeof crypto.randomUUID);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(FIXED_TIMESTAMP);

  return {
    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      const questFilePath = filePathContract.parse(
        `${QUESTS_DIR}/${String(quest.folder)}/quest.json`,
      );
      dirs.set(filePathContract.parse(GUILDS_DIR), [fileNameContract.parse(GUILD_ID)]);
      dirs.set(filePathContract.parse(QUESTS_DIR), [fileNameContract.parse(String(quest.folder))]);
      files.set(questFilePath, fileContentsContract.parse(JSON.stringify(quest)));
      questFilePathRef.value = questFilePath;
    },

    wardExits: ({
      exitCode,
      runId,
      detailJson,
    }: {
      exitCode: ExitCode;
      runId: FileName;
      detailJson: FileContents;
    }): void => {
      wardRuns.push({
        exitCode,
        output: ErrorMessageStub({ value: `run: ${String(runId)}\nlint: PASS` }),
      });
      detailRuns.push({
        exitCode: ExitCodeStub({ value: 0 }),
        output: ErrorMessageStub({ value: String(detailJson) }),
      });
    },

    wardExitsWithoutRunId: ({ exitCode }: { exitCode: ExitCode }): void => {
      wardRuns.push({
        exitCode,
        output: ErrorMessageStub({ value: 'fatal: ward crashed before init' }),
      });
    },

    getPersistedQuest: (): Quest => {
      const contents = files.get(questFilePathRef.value);
      if (contents === undefined) {
        throw new Error('questRunWardBrokerProxy: no quest file persisted');
      }
      return questContract.parse(JSON.parse(String(contents)));
    },

    getSpawnedWardArgs: (): unknown =>
      (
        childProcessSpawnStreamLinesAdapter as jest.MockedFunction<
          typeof childProcessSpawnStreamLinesAdapter
        >
      ).mock.calls[0]?.[0]?.args,

    getDetailWrites: (): readonly { path: unknown; contents: unknown }[] =>
      [...files.entries()]
        .filter(([path]) => String(path).includes('/ward-results/'))
        .map(([path, contents]) => ({ path, contents })),

    getMkdirPaths: (): readonly unknown[] => [...mkdirPaths],
  };
};
