import { writeFile } from 'fs/promises';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileBytesAdapterProxy } from '../../../adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.proxy';
import { fsWriteFileBytesAdapterProxy } from '../../../adapters/fs/write-file-bytes/fs-write-file-bytes-adapter.proxy';

export const localImageCopyBrokerProxy = (): {
  stageCopyIds: (params: { ids: readonly string[] }) => void;
  sourceReads: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  sourceReadFails: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  destinationWriteFails: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  writtenDestinations: () => AbsoluteFilePath[];
  writtenBytesFor: (params: { filePath: AbsoluteFilePath }) => unknown;
} => {
  const readProxy = fsReadFileBytesAdapterProxy();
  const writeProxy = fsWriteFileBytesAdapterProxy();
  pathJoinAdapterProxy();
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  // A second handle purely for READING writeFile's call history — fsWriteFileBytesAdapterProxy
  // above already owns the staging (.calledWith); this handle only ever reads (.callsMatching),
  // so it cannot collide with that staging.
  const writeCallsHandle = registerMock({ fn: writeFile });

  // Every destination write succeeds by default; destinationWriteFails overrides one address.
  writeProxy.succeeds({ filePath: (): boolean => true });

  return {
    stageCopyIds: ({ ids }: { ids: readonly string[] }): void => {
      // Each id answers ONE match's mint, consumed in match order — the broker mints
      // crypto.randomUUID() synchronously before its first await, so staged order lines up
      // with the matches array order regardless of read-completion order.
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },
    sourceReads: ({ filePath, bytes }: { filePath: AbsoluteFilePath; bytes: Uint8Array }): void => {
      readProxy.returns({ filePath, bytes });
    },
    sourceReadFails: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      readProxy.throws({ filePath, error });
    },
    destinationWriteFails: ({
      filePath,
      error,
    }: {
      filePath: AbsoluteFilePath;
      error: Error;
    }): void => {
      writeProxy.throws({ filePath, error });
    },
    writtenDestinations: (): AbsoluteFilePath[] =>
      writeCallsHandle.callsMatching([]).map((call) => absoluteFilePathContract.parse(call[0])),
    writtenBytesFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      writeProxy.writtenArgsFor({ filePath })?.[1],
  };
};
