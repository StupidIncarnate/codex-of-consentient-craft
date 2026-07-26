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
  type QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

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

type WorkItemId = ReturnType<typeof QuestWorkItemIdStub>;

export const questRunWardBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  wardExits: (params: { exitCode: ExitCode; runId: FileName; detailJson: FileContents }) => void;
  wardExitsWithoutRunId: (params: { exitCode: ExitCode }) => void;
  getPersistedQuest: () => Quest;
  getSpawnedWardArgs: () => unknown;
  getDetailWrites: () => readonly { path: unknown; contents: unknown }[];
  getMkdirPaths: () => readonly unknown[];
  getPersistedWorkItemStatusesInWriteOrder: (params: {
    workItemId: WorkItemId;
  }) => readonly unknown[];
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

  // Every implementation below is staged with `calledWith([])` — none of these functions has a
  // single call-identifying argument worth addressing: each one is a generic simulator that reads
  // the REAL argument it was invoked with (path, dirPath, from/to, ...) straight out of the shared
  // `files`/`dirs`/queue state above, exactly like the real filesystem would. There is only ever
  // ONE behaviour registered per function; the discrimination between quest files, ward-result
  // blobs, etc. happens inside each implementation, not in the staged address.
  const pathJoinHandle = registerMock({ fn: pathJoinAdapter });
  const pathJoinImpl = ({ paths }: Parameters<typeof pathJoinAdapter>[0]): FilePath =>
    filePathContract.parse(paths.join('/'));
  pathJoinHandle.calledWith([]).implement(pathJoinImpl as never);

  const processCwdHandle = registerMock({ fn: processCwdAdapter });
  const processCwdImpl = (): FilePath => filePathContract.parse('/project');
  processCwdHandle.calledWith([]).implement(processCwdImpl as never);

  const dungeonmasterHomeFindHandle = registerMock({ fn: dungeonmasterHomeFindBroker });
  const dungeonmasterHomeFindImpl = (): { homePath: FilePath } => ({
    homePath: filePathContract.parse(HOME_PATH),
  });
  dungeonmasterHomeFindHandle.calledWith([]).implement(dungeonmasterHomeFindImpl as never);

  const fsReaddirWithTypesHandle = registerMock({ fn: fsReaddirWithTypesAdapter });
  const fsReaddirWithTypesImpl = ({
    dirPath,
  }: Parameters<typeof fsReaddirWithTypesAdapter>[0]): Dirent[] =>
    (dirs.get(filePathContract.parse(String(dirPath))) ?? []).map((name) =>
      Object.assign(Object.create(Dirent.prototype) as Dirent, {
        name,
        isDirectory: (): boolean => true,
      }),
    );
  fsReaddirWithTypesHandle.calledWith([]).implement(fsReaddirWithTypesImpl as never);

  const fsReadFileHandle = registerMock({ fn: fsReadFileAdapter });
  const fsReadFileImpl = async ({
    filePath,
  }: Parameters<typeof fsReadFileAdapter>[0]): Promise<FileContents> => {
    const contents = files.get(filePathContract.parse(String(filePath)));
    if (contents === undefined) {
      return Promise.reject(new Error(`Failed to read file at ${String(filePath)}`));
    }
    return Promise.resolve(contents);
  };
  fsReadFileHandle.calledWith([]).implement(fsReadFileImpl as never);

  const questWrites: ReturnType<typeof fileContentsContract.parse>[] = [];

  const fsWriteFileHandle = registerMock({ fn: fsWriteFileAdapter });
  const fsWriteFileImpl = async ({
    filePath,
    contents,
  }: Parameters<typeof fsWriteFileAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    files.set(
      filePathContract.parse(String(filePath)),
      fileContentsContract.parse(String(contents)),
    );
    // Keep every quest persist, not just the last one: an intermediate status the final state
    // has already moved past (ward stamped `in_progress` before the spawn) is invisible in
    // `files`, which only holds the newest contents per path. Matched on CONTENT, not filename —
    // the atomic persist writes a temp path and renames — so the ward-detail blob, which is not
    // a quest, never enters the sequence.
    questWrites.push(fileContentsContract.parse(String(contents)));
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  fsWriteFileHandle.calledWith([]).implement(fsWriteFileImpl as never);

  const fsRenameHandle = registerMock({ fn: fsRenameAdapter });
  const fsRenameImpl = async ({
    from,
    to,
  }: Parameters<typeof fsRenameAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    const fromPath = filePathContract.parse(String(from));
    const contents = files.get(fromPath);
    files.delete(fromPath);
    if (contents !== undefined) {
      files.set(filePathContract.parse(String(to)), contents);
    }
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  fsRenameHandle.calledWith([]).implement(fsRenameImpl as never);

  const fsAppendFileHandle = registerMock({ fn: fsAppendFileAdapter });
  const fsAppendFileImpl = async (): Promise<ReturnType<typeof adapterResultContract.parse>> =>
    Promise.resolve(adapterResultContract.parse({ success: true }));
  fsAppendFileHandle.calledWith([]).implement(fsAppendFileImpl as never);

  const fsMkdirHandle = registerMock({ fn: fsMkdirAdapter });
  const fsMkdirImpl = async ({
    filepath,
  }: Parameters<typeof fsMkdirAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    mkdirPaths.push(String(filepath));
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  fsMkdirHandle.calledWith([]).implement(fsMkdirImpl as never);

  // Ward spawn (childProcessSpawnStreamLinesAdapter) and ward-detail fetch
  // (wardDetailBroker → childProcessSpawnCaptureAdapter) are queued per test via wardExits*.
  const spawnStreamLinesHandle = registerMock({ fn: childProcessSpawnStreamLinesAdapter });
  const spawnStreamLinesImpl = async ({
    onLine,
  }: Parameters<typeof childProcessSpawnStreamLinesAdapter>[0]): Promise<{
    exitCode: ExitCode;
    output: ErrorMessage;
  }> => {
    const next = wardRuns.shift();
    if (next === undefined) {
      return Promise.reject(new Error('questRunWardBrokerProxy: no ward spawn result queued'));
    }
    // Replay the queued output through the caller's callback exactly as the real adapter does,
    // so a test can assert ward's lines actually reach the caller instead of only its exit code.
    for (const line of String(next.output)
      .split('\n')
      .filter((entry) => entry.length > 0)) {
      onLine(line);
    }
    return Promise.resolve(next);
  };
  spawnStreamLinesHandle.calledWith([]).implement(spawnStreamLinesImpl as never);

  const spawnCaptureHandle = registerMock({ fn: childProcessSpawnCaptureAdapter });
  const spawnCaptureImpl = async (): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
    const next = detailRuns.shift();
    if (next === undefined) {
      return Promise.resolve({
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: '' }),
      });
    }
    return Promise.resolve(next);
  };
  spawnCaptureHandle.calledWith([]).implement(spawnCaptureImpl as never);

  // Pin crypto.randomUUID + Date.prototype.toISOString so persisted ids and timestamps are
  // deterministic. Call #0 is always the wardResultId; every later call (spiritmender op id,
  // ward-continuation op id, advance's new work-item id) gets a distinct sequenced UUID. Neither
  // global takes an identifying argument, so `calledWith([])` is the honest address for both.
  const uuidCounter = { value: 0 };
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  const uuidImpl = (): ReturnType<typeof crypto.randomUUID> => {
    const index = uuidCounter.value;
    uuidCounter.value += 1;
    const value =
      index === 0
        ? FIXED_WARD_RESULT_UUID
        : `f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0${String(index).padStart(UUID_SUFFIX_WIDTH, '0')}`;
    return value as ReturnType<typeof crypto.randomUUID>;
  };
  uuidSpy.calledWith([]).implement(uuidImpl as never);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

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

    // No real address exists — staging above is deliberately unaddressed ([]) because retry
    // scenarios queue several ward runs with nothing to distinguish them by. `.map()` walks the
    // COMPLETE call history into per-call args first, so picking the first entry reads a value
    // already computed from every recorded call, not an unaddressed peek.
    getSpawnedWardArgs: (): unknown => {
      const argsPerCall = spawnStreamLinesHandle.callsMatching([]).map((call) => {
        const [params] = call;
        const typedParams = params as
          | Parameters<typeof childProcessSpawnStreamLinesAdapter>[0]
          | undefined;
        return typedParams?.args;
      });
      return argsPerCall[0];
    },

    getDetailWrites: (): readonly { path: unknown; contents: unknown }[] =>
      [...files.entries()]
        .filter(([path]) => String(path).includes('/ward-results/'))
        .map(([path, contents]) => ({ path, contents })),

    getMkdirPaths: (): readonly unknown[] => [...mkdirPaths],

    // One entry per quest-file write that touched this work item, in write order, deduped so
    // unrelated persists (wardResults append) do not pad the sequence.
    getPersistedWorkItemStatusesInWriteOrder: ({
      workItemId,
    }: {
      workItemId: WorkItemId;
    }): readonly unknown[] => {
      // Drop non-quest writes BEFORE collapsing repeats — a gap left in the middle would break
      // adjacency and let an unchanged status through twice.
      const statuses = questWrites
        .map((contents) => {
          const parsed = questContract.safeParse(JSON.parse(String(contents)));
          if (!parsed.success) {
            return undefined;
          }
          return parsed.data.workItems.find((item) => item.id === workItemId)?.status;
        })
        .filter((status) => status !== undefined);

      return statuses.filter((status, index) => status !== statuses[index - 1]);
    },
  };
};
