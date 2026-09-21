/**
 * PURPOSE: Proxy for questRunStepBroker — backs the quest file with a virtual store so the real
 * questOperationsUpdateBroker runs twice (the `in_progress` stamp, then the record) and the second
 * write reads the first, and STUBS the handler itself. What this broker adds is the RECORD; which
 * handler ran and how it classified is `stepHandlerRunBroker`'s own suite.
 *
 * USAGE:
 * const proxy = questRunStepBrokerProxy();
 * proxy.setupQuest({ quest });
 * proxy.handlerReturns({ result: StepHandlerResultStub({ outcome: 'done' }) });
 * // ...call questRunStepBroker...
 * expect(proxy.getPersistedQuest().workItems[0].declaredWord).toBe('done');
 */

import { Dirent } from 'fs';

import {
  fsExistsSyncAdapter,
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import {
  adapterResultContract,
  fileContentsContract,
  fileNameContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type {
  FileContents,
  FileName,
  FilePath,
  Quest,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import type { StepHandlerResultStub } from '../../../contracts/step-handler-result/step-handler-result.stub';
import { stepHandlerRunBroker } from '../../step-handler/run/step-handler-run-broker';
import { stepHandlerRunBrokerProxy } from '../../step-handler/run/step-handler-run-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';

registerModuleMock({
  module: '@dungeonmaster/shared/adapters',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/adapters'),
    fsExistsSyncAdapter: jest.fn(),
    fsReaddirWithTypesAdapter: jest.fn(),
    pathJoinAdapter: jest.fn(),
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
registerModuleMock({ module: '../../step-handler/run/step-handler-run-broker' });

type QuestInput = ReturnType<typeof QuestStub>;
type StepHandlerResult = ReturnType<typeof StepHandlerResultStub>;
// The handler's own parameter object. `callsMatching` hands back `unknown[][]`, which is genuinely
// all the mock knows; naming the shape through the function it recorded is the one place that
// information exists.
type HandlerCall = Parameters<typeof stepHandlerRunBroker>[0];

const HOME_PATH = '/home/testuser/.dungeonmaster';
const GUILD_ID = 'g1';
const GUILDS_DIR = `${HOME_PATH}/guilds`;
const QUESTS_DIR = `${GUILDS_DIR}/${GUILD_ID}/quests`;
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
// `questPersistBroker` writes beside the quest file and renames over it.
const TEMP_SUFFIX = '.tmp';
// The folder `stepHandlerWardBrokerProxy`'s module mock of `questFindQuestPathBroker` resolves to.
// The quest stub's own `folder` is not consulted: that mock is what the lookup returns, so the
// virtual store has to answer for ITS path.
const QUEST_FOLDER = 'add-auth';

export const questRunStepBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  handlerReturns: (params: { result: StepHandlerResult }) => void;
  getHandlerCalls: () => readonly HandlerCall[];
  getPersistedQuest: () => Quest;
  getAllPersistedQuests: () => readonly Quest[];
} => {
  // Composed FIRST so every implementation registered below outranks theirs on equal specificity.
  // The ward handler's proxy module-mocks `questFindQuestPathBroker` to resolve a `guilds/g1/…`
  // path, which is why GUILD_ID below is `g1` — the virtual store has to answer for the path that
  // mock hands back, not for one of its own choosing.
  stepHandlerRunBrokerProxy();
  questOperationsUpdateBrokerProxy();
  const handlerHandle = registerMock({ fn: stepHandlerRunBroker });

  // Every module this file mocks, pointed back at the real thing. A caller's proxy IMPORTS this
  // file, so these `jest.mock` calls are hoisted for that whole suite; left unstaged they would make
  // `pathJoinAdapter` throw for a caller that never asked for any of this. `setupQuest` is what
  // swaps them for the virtual store.
  const realAdapters = requireActual<{
    fsExistsSyncAdapter: typeof fsExistsSyncAdapter;
    fsReaddirWithTypesAdapter: typeof fsReaddirWithTypesAdapter;
    pathJoinAdapter: typeof pathJoinAdapter;
  }>({ module: '@dungeonmaster/shared/adapters' });
  const realBrokers = requireActual<{
    dungeonmasterHomeFindBroker: typeof dungeonmasterHomeFindBroker;
  }>({ module: '@dungeonmaster/shared/brokers' });
  const realAppendFile = requireActual<{ fsAppendFileAdapter: typeof fsAppendFileAdapter }>({
    module: '../../../adapters/fs/append-file/fs-append-file-adapter',
  });
  const realReadFile = requireActual<{ fsReadFileAdapter: typeof fsReadFileAdapter }>({
    module: '../../../adapters/fs/read-file/fs-read-file-adapter',
  });
  const realRename = requireActual<{ fsRenameAdapter: typeof fsRenameAdapter }>({
    module: '../../../adapters/fs/rename/fs-rename-adapter',
  });
  const realWriteFile = requireActual<{ fsWriteFileAdapter: typeof fsWriteFileAdapter }>({
    module: '../../../adapters/fs/write-file/fs-write-file-adapter',
  });

  const files = new Map<FilePath, FileContents>();
  const dirs = new Map<FilePath, FileName[]>();
  const questWrites: FileContents[] = [];
  const questFilePathRef = { value: filePathContract.parse('/unset/quest.json') };

  const pathJoinHandle = registerMock({ fn: pathJoinAdapter });
  const pathJoinImpl = ({ paths }: Parameters<typeof pathJoinAdapter>[0]): FilePath =>
    filePathContract.parse(paths.join('/'));
  pathJoinHandle.calledWith([]).implement(realAdapters.pathJoinAdapter as never);

  const homeFindHandle = registerMock({ fn: dungeonmasterHomeFindBroker });
  const homeFindImpl = (): { homePath: FilePath } => ({
    homePath: filePathContract.parse(HOME_PATH),
  });
  homeFindHandle.calledWith([]).implement(realBrokers.dungeonmasterHomeFindBroker as never);

  const readdirWithTypesHandle = registerMock({ fn: fsReaddirWithTypesAdapter });
  const readdirWithTypesImpl = ({
    dirPath,
  }: Parameters<typeof fsReaddirWithTypesAdapter>[0]): Dirent[] =>
    (dirs.get(filePathContract.parse(String(dirPath))) ?? []).map((name) =>
      Object.assign(Object.create(Dirent.prototype) as Dirent, {
        name,
        isDirectory: (): boolean => true,
      }),
    );
  readdirWithTypesHandle.calledWith([]).implement(realAdapters.fsReaddirWithTypesAdapter as never);

  const existsSyncHandle = registerMock({ fn: fsExistsSyncAdapter });
  const existsSyncImpl = ({ filePath }: Parameters<typeof fsExistsSyncAdapter>[0]): boolean =>
    files.has(filePathContract.parse(String(filePath)));
  existsSyncHandle.calledWith([]).implement(realAdapters.fsExistsSyncAdapter as never);

  const readFileHandle = registerMock({ fn: fsReadFileAdapter });
  const readFileImpl = async ({
    filePath,
  }: Parameters<typeof fsReadFileAdapter>[0]): Promise<FileContents> => {
    const contents = files.get(filePathContract.parse(String(filePath)));
    if (contents === undefined) {
      return Promise.reject(new Error(`Failed to read file at ${String(filePath)}`));
    }
    return Promise.resolve(contents);
  };
  readFileHandle.calledWith([]).implement(realReadFile.fsReadFileAdapter as never);

  const writeFileHandle = registerMock({ fn: fsWriteFileAdapter });
  const writeFileImpl = async ({
    filePath,
    contents,
  }: Parameters<typeof fsWriteFileAdapter>[0]): Promise<
    ReturnType<typeof adapterResultContract.parse>
  > => {
    files.set(
      filePathContract.parse(String(filePath)),
      fileContentsContract.parse(String(contents)),
    );
    // Every quest persist is kept, not just the last: the `in_progress` stamp is invisible in
    // `files` once the record overwrites it, and it is exactly what a test needs to see.
    questWrites.push(fileContentsContract.parse(String(contents)));
    return Promise.resolve(adapterResultContract.parse({ success: true }));
  };
  writeFileHandle.calledWith([]).implement(realWriteFile.fsWriteFileAdapter as never);

  const renameHandle = registerMock({ fn: fsRenameAdapter });
  const renameImpl = async ({
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
  renameHandle.calledWith([]).implement(realRename.fsRenameAdapter as never);

  const appendFileHandle = registerMock({ fn: fsAppendFileAdapter });
  const appendFileImpl = async (): Promise<ReturnType<typeof adapterResultContract.parse>> =>
    Promise.resolve(adapterResultContract.parse({ success: true }));
  appendFileHandle.calledWith([]).implement(realAppendFile.fsAppendFileAdapter as never);

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

  return {
    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      const questFilePath = filePathContract.parse(`${QUESTS_DIR}/${QUEST_FOLDER}/quest.json`);
      const tempFilePath = filePathContract.parse(`${questFilePath}${TEMP_SUFFIX}`);
      // The virtual store takes over here, not at construction — see the block above.
      pathJoinHandle.calledWith([]).implement(pathJoinImpl as never);
      homeFindHandle.calledWith([]).implement(homeFindImpl as never);
      readdirWithTypesHandle.calledWith([]).implement(readdirWithTypesImpl as never);
      existsSyncHandle.calledWith([]).implement(existsSyncImpl as never);
      readFileHandle.calledWith([]).implement(readFileImpl as never);
      writeFileHandle.calledWith([]).implement(writeFileImpl as never);
      renameHandle.calledWith([]).implement(renameImpl as never);
      appendFileHandle.calledWith([]).implement(appendFileImpl as never);

      dirs.set(filePathContract.parse(GUILDS_DIR), [fileNameContract.parse(GUILD_ID)]);
      dirs.set(filePathContract.parse(QUESTS_DIR), [fileNameContract.parse(QUEST_FOLDER)]);
      files.set(questFilePath, fileContentsContract.parse(JSON.stringify(quest)));
      questFilePathRef.value = questFilePath;

      // ADDRESSED on the quest's own paths, not just the zero-argument catch-all above. The four
      // step-handler proxies `stepHandlerRunBrokerProxy` builds each carry a virtual filesystem of
      // their own staged at that same catch-all specificity, so an unaddressed registration here
      // would be answering the same question as theirs and the winner would be an ordering
      // accident. A described path is strictly more specific and settles it.
      readFileHandle.calledWith([{ filePath: questFilePath }]).implement(readFileImpl as never);
      writeFileHandle.calledWith([{ filePath: tempFilePath }]).implement(writeFileImpl as never);
      renameHandle.calledWith([{ from: tempFilePath }]).implement(renameImpl as never);
    },

    handlerReturns: ({ result }: { result: StepHandlerResult }): void => {
      handlerHandle.calledWith([]).resolves(result);
    },

    getHandlerCalls: (): readonly HandlerCall[] =>
      handlerHandle.callsMatching([]).map((call) => call[0] as HandlerCall),

    getPersistedQuest: (): Quest =>
      questContract.parse(JSON.parse(String(files.get(questFilePathRef.value)))),

    getAllPersistedQuests: (): readonly Quest[] =>
      questWrites.map((contents) => questContract.parse(JSON.parse(String(contents)))),
  };
};
