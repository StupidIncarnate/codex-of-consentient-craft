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

const imagesDirPredicate = (path: unknown): boolean =>
  typeof path === 'string' && path.endsWith('/images');
const uploadPathPredicate = (path: unknown): boolean =>
  typeof path === 'string' && path.includes('/images/');

const base64Of = ({ bytes }: { bytes: unknown }): unknown =>
  Buffer.isBuffer(bytes) ? bytes.toString('base64') : bytes;

export const pastedImagePersistBrokerProxy = (): {
  setupHome: (params: { homePath: string }) => void;
  stageImageIds: (params: { ids: readonly string[] }) => void;
  mkdirRequestedDirPaths: () => unknown[];
  writtenPayloadFor: (params: { filePath: string }) => unknown;
  writtenPayloadsInOrder: () => unknown[];
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
  const ensureDirChild = ensureDirProxy();
  const writeFileChild = writeFileFromBase64Proxy();
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
  // Every images directory this broker ensures, and every upload destination it writes to, is
  // computed at call time from a guildId/questId/uuid this proxy never receives, so the gateway
  // proxies are addressed by the one structural fact every such path shares: the directory ends in
  // `/images`, and an upload lands under `/images/` whatever id the test stages for it (a real uuid
  // in some tests, a descriptive stub id like "first-image-id" in others).
  // Staged from every entry a test uses to drive an image through the broker (home, uploads, local
  // copies), since a proxy constructor may only create children and register handles. Restaging
  // the same predicate is harmless.
  const stageImagesFolder = (): void => {
    ensureDirChild.succeedsMatchingPath({ path: imagesDirPredicate });
    writeFileChild.succeedsMatchingPath({ path: uploadPathPredicate });
  };

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
      stageImagesFolder();
    },
    stageImageIds: ({ ids }: { ids: readonly string[] }): void => {
      stageImagesFolder();
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
      ensureDirChild.getCallsFor({ path: imagesDirPredicate }).map((call) => String(call[0])),
    // The gateway writes the decoded bytes; tests read the base64 the responder was handed.
    writtenPayloadFor: ({ filePath }: { filePath: string }): unknown =>
      base64Of({ bytes: writeFileChild.getCallsFor({ path: filePath }).at(-1)?.[1] }),
    writtenPayloadsInOrder: (): unknown[] =>
      writeFileChild
        .getCallsFor({ path: uploadPathPredicate })
        .map((call) => base64Of({ bytes: call[1] })),
    writeCallCount: (): unknown =>
      writeFileChild.getCallsFor({ path: uploadPathPredicate }).length +
      copyProxy.writtenDestinations().length,
    // Both the base64 upload write and the raw-bytes copy write are complete sets of paths this
    // broker actually wrote to disk, upload and copy alike, in that order.
    writtenImagePaths: (): unknown[] => [
      ...writeFileChild.getCallsFor({ path: uploadPathPredicate }).map((call) => String(call[0])),
      ...copyProxy.writtenDestinations().map((path) => String(path)),
    ],
    sourceReadAttemptedPaths: (): unknown[] => copyProxy.sourceReadAttemptedPaths(),
    stageCopyIds: ({ ids }: { ids: readonly string[] }): void => {
      stageImagesFolder();
      copyProxy.stageCopyIds({ ids });
    },
    sourceReads: ({ filePath, bytes }: { filePath: AbsoluteFilePath; bytes: Uint8Array }): void => {
      stageImagesFolder();
      copyProxy.sourceReads({ filePath, bytes });
    },
    sourceReadFails: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      stageImagesFolder();
      copyProxy.sourceReadFails({ filePath, error });
    },
    destinationWriteFails: ({
      filePath,
      error,
    }: {
      filePath: AbsoluteFilePath;
      error: Error;
    }): void => {
      stageImagesFolder();
      copyProxy.destinationWriteFails({ filePath, error });
    },
    writtenDestinations: (): AbsoluteFilePath[] => copyProxy.writtenDestinations(),
    writtenBytesFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      copyProxy.writtenBytesFor({ filePath }),
  };
};
