import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import {
  pathJoinAdapterProxy,
  locationsQuestFolderPathFindBrokerProxy,
  locationsQuestImagesPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileBase64AdapterProxy } from '../../../adapters/fs/write-file-base64/fs-write-file-base64-adapter.proxy';
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
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileBase64AdapterProxy();
  const copyProxy = localImageCopyBrokerProxy();
  pathJoinAdapterProxy();
  locationsQuestFolderPathFindBrokerProxy();
  locationsQuestImagesPathFindBrokerProxy();
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  const homedirHandle = registerMock({ fn: homedir });
  // Extra handles on the SAME npm functions fsMkdirAdapterProxy/fsWriteFileBase64AdapterProxy/
  // localImageCopyBrokerProxy already mock (mkdir, writeFile, readFile) — registerMock shares
  // staging AND call history across every handle on one function, so a second handle here only
  // ever READS (.callsMatching), never .calledWith, and cannot collide with the staging those
  // proxies already own.
  const mkdirCallsHandle = registerMock({ fn: mkdir });
  const writeCallsHandle = registerMock({ fn: writeFile });
  const readCallsHandle = registerMock({ fn: readFile });

  // Every send unconditionally creates the images dir and writes every attachment — there is no
  // failure path under test, so both adapters succeed for any address this broker computes.
  mkdirProxy.succeeds({ dirPath: (): boolean => true });
  writeProxy.succeeds({ filePath: (): boolean => true });

  return {
    setupHome: ({ homePath }: { homePath: string }): void => {
      // osHomedirAdapter reads DUNGEONMASTER_HOME before falling back to homedir() — clearing it
      // here is what makes the mocked homedir() below actually decide the resolved path.
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      // Sticky, not one-shot: a test drives the broker across MULTIPLE sends and every one of
      // them must resolve to the same home. Registered AFTER the locations proxies above (which
      // also stage a sticky '/home/default' via their own nested osHomedirAdapterProxy), so this
      // later registration is the one that wins.
      homedirHandle.calledWith([]).returns(absoluteFilePathContract.parse(homePath));
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
      mkdirCallsHandle.callsMatching([]).map((call) => String(call[0])),
    writtenPayloadFor: ({ filePath }: { filePath: string }): unknown =>
      writeProxy.writtenArgsFor({ filePath: absoluteFilePathContract.parse(filePath) })?.[1],
    writeCallCount: (): unknown => writeCallsHandle.callsMatching([]).length,
    // Both the base64 upload write and the raw-bytes copy write land on this same npm writeFile,
    // staged at different argument specificity — so this list is the complete set of paths this
    // broker actually wrote to disk, upload and copy alike.
    writtenImagePaths: (): unknown[] =>
      writeCallsHandle.callsMatching([]).map((call) => String(call[0])),
    sourceReadAttemptedPaths: (): unknown[] =>
      readCallsHandle.callsMatching([]).map((call) => String(call[0])),
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
