import { ensureDir, writeFileFromBase64 } from '#gateway/node/fs__promises';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileFromBase64Proxy } from '#gateway/node/fs__promises/write-file-from-base64/write-file-from-base64.proxy';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import {
  locationsQuestFolderPathFindBrokerProxy,
  locationsQuestImagesPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';

import { localImageCopyBrokerProxy } from '../../local-image/copy/local-image-copy-broker.proxy';

export const pastedImagePersistBrokerProxy = (): {
  setupHome: (params: { homePath: string }) => void;
  stageImageIds: (params: { ids: readonly string[] }) => void;
  mkdirRequestedDirPaths: () => unknown[];
  writtenPayloadFor: (params: { filePath: string }) => unknown;
  writeCallCount: () => unknown;
  writtenImagePaths: () => unknown[];
  sourceReadAttemptedPaths: () => unknown[];
  stageCopyIds: (params: { ids: readonly string[] }) => void;
  sourceReads: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  sourceReadFails: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  destinationWriteFails: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  writtenDestinations: () => AbsoluteFilePath[];
  writtenBytesFor: (params: { filePath: AbsoluteFilePath }) => unknown;
} => {
  ensureDirProxy(); // satisfies enforce-proxy-child-creation; this broker's real ensureDir calls
  // are mocked directly on `ensureDir` below, not through this child proxy's own exact-path-only
  // `succeeds`/`rejects`.
  writeFileFromBase64Proxy(); // same reason, for `writeFileFromBase64` below.
  const copyProxy = localImageCopyBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  locationsQuestFolderPathFindBrokerProxy();
  locationsQuestImagesPathFindBrokerProxy();
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  // This broker's own images-directory resolution (locationsQuestFolderPathFindBroker ->
  // locationsGuildQuestsPathFindBroker -> locationsGuildPathFindBroker ->
  // dungeonmasterHomeFindBroker) reaches homedir() through '#gateway/node/os' — the SAME
  // specifier dungeonmasterHomeFindBroker itself imports (mocking raw 'os' never reaches it: the
  // gateway file captures its own reference to the real module at ITS OWN load time, so a mock on
  // a different specifier is silently unused — see dungeonmasterHomeFindBrokerProxy's own
  // header). Staged directly here rather than by composing dungeonmasterHomeFindBrokerProxy
  // (enforce-proxy-child-creation refuses that: this file's own implementation never imports
  // dungeonmasterHomeFindBroker directly, only locationsQuestFolderPathFindBroker/
  // locationsQuestImagesPathFindBroker, already composed above) — the locations proxies already
  // construct dungeonmasterHomeFindBrokerProxy transitively, which is what registers its join()
  // real-passthrough default, so every join() beneath the resolved home dir still runs REAL.
  const homedirHandle = registerMock({ fn: homedir });
  // Every dirPath this broker ensures, and every upload destination it writes to, is computed at
  // call time from a guildId/questId/uuid this proxy never receives — ensureDirProxy's and
  // writeFileFromBase64Proxy's own succeeds/rejects take only an exact literal path (no
  // matching-path variant), so both are mocked directly on their gateway export instead, each
  // addressed by the one real structural fact every such call shares.
  const ensureDirHandle = registerMock({ fn: ensureDir });
  ensureDirHandle
    .calledWith([(path: unknown) => typeof path === 'string' && path.endsWith('/images')])
    .resolves(undefined);
  const writeFileFromBase64Handle = registerMock({ fn: writeFileFromBase64 });
  // Every upload lands under a quest's images directory, whatever id the test stages for it (a
  // real uuid in some tests, a descriptive stub id like "first-image-id" in others) — so the
  // address is the directory invariant, not the minted name's own shape.
  writeFileFromBase64Handle
    .calledWith([(path: unknown): boolean => typeof path === 'string' && path.includes('/images/')])
    .resolves(undefined);

  return {
    setupHome: ({ homePath }: { homePath: string }): void => {
      // dungeonmasterHomeFindBroker reads DUNGEONMASTER_HOME before falling back to homedir() —
      // clearing it here is what makes the staged homedir() below actually decide the resolved
      // path.
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      // Sticky, not one-shot: a test drives the broker across MULTIPLE sends and every one of
      // them must resolve to the same home. This is the LAST word on homedir() for every real
      // chain composed in the same test that reaches it through dungeonmasterHomeFindBroker (a
      // sibling proxy such as questFindQuestPathBrokerProxy's own setupQuestPath scenario stages
      // only a one-shot for its own single call, never a sticky override, precisely so this
      // registration — whenever it runs — is what every LATER call to homedir() answers to).
      homedirHandle.calledWith([]).returns(homePath);
    },
    stageImageIds: ({ ids }: { ids: readonly string[] }): void => {
      // Each id answers ONE call, consumed in the order staged. images.map() invokes
      // crypto.randomUUID() synchronously per image before any write starts, so staging order
      // lines up with input order. Registered on the SAME shared crypto.randomUUID queue the
      // composed localImageCopyBrokerProxy's stageCopyIds appends to below, so a test that stages
      // uploads then copies gets upload ids consumed first, copy ids second.
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },
    mkdirRequestedDirPaths: (): unknown[] =>
      ensureDirHandle.callsMatching([]).map((call) => String(call[0])),
    writtenPayloadFor: ({ filePath }: { filePath: string }): unknown =>
      writeFileFromBase64Handle.callsMatching([filePath]).at(-1)?.[1],
    writeCallCount: (): unknown =>
      writeFileFromBase64Handle.callsMatching([]).length + copyProxy.writtenDestinations().length,
    // Both the base64 upload write and the raw-bytes copy write are complete sets of paths this
    // broker actually wrote to disk, upload and copy alike, in that order.
    writtenImagePaths: (): unknown[] => [
      ...writeFileFromBase64Handle.callsMatching([]).map((call) => String(call[0])),
      ...copyProxy.writtenDestinations().map((path) => String(path)),
    ],
    sourceReadAttemptedPaths: (): unknown[] => copyProxy.sourceReadAttemptedPaths(),
    stageCopyIds: ({ ids }: { ids: readonly string[] }): void => {
      copyProxy.stageCopyIds({ ids });
    },
    sourceReads: ({ filePath, bytes }: { filePath: AbsoluteFilePath; bytes: Uint8Array }): void => {
      copyProxy.sourceReads({ filePath, bytes });
    },
    sourceReadFails: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      copyProxy.sourceReadFails({ filePath, error });
    },
    destinationWriteFails: ({
      filePath,
      error,
    }: {
      filePath: AbsoluteFilePath;
      error: Error;
    }): void => {
      copyProxy.destinationWriteFails({ filePath, error });
    },
    writtenDestinations: (): AbsoluteFilePath[] => copyProxy.writtenDestinations(),
    writtenBytesFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      copyProxy.writtenBytesFor({ filePath }),
  };
};
