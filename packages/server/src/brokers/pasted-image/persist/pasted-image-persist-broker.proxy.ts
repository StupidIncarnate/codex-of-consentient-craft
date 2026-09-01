import { mkdir, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import {
  pathJoinAdapterProxy,
  locationsQuestFolderPathFindBrokerProxy,
  locationsQuestImagesPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileBase64AdapterProxy } from '../../../adapters/fs/write-file-base64/fs-write-file-base64-adapter.proxy';

export const pastedImagePersistBrokerProxy = (): {
  setupHome: (params: { homePath: string }) => void;
  stageImageIds: (params: { ids: readonly string[] }) => void;
  mkdirRequestedDirPaths: () => unknown[];
  writtenPayloadFor: (params: { filePath: string }) => unknown;
  writeCallCount: () => unknown;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileBase64AdapterProxy();
  pathJoinAdapterProxy();
  locationsQuestFolderPathFindBrokerProxy();
  locationsQuestImagesPathFindBrokerProxy();
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  const homedirHandle = registerMock({ fn: homedir });
  // Extra handles on the SAME npm functions fsMkdirAdapterProxy/fsWriteFileBase64AdapterProxy
  // already mock (mkdir, writeFile) — registerMock shares staging AND call history across every
  // handle on one function, so a second handle here only ever READS (.callsMatching), never
  // .calledWith, and cannot collide with the staging those proxies already own.
  const mkdirCallsHandle = registerMock({ fn: mkdir });
  const writeCallsHandle = registerMock({ fn: writeFile });

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
      // lines up with input order.
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },
    mkdirRequestedDirPaths: (): unknown[] =>
      mkdirCallsHandle.callsMatching([]).map((call) => String(call[0])),
    writtenPayloadFor: ({ filePath }: { filePath: string }): unknown =>
      writeProxy.writtenArgsFor({ filePath: absoluteFilePathContract.parse(filePath) })?.[1],
    writeCallCount: (): unknown => writeCallsHandle.callsMatching([]).length,
  };
};
