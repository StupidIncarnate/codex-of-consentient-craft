import { randomUUID } from '#gateway/node/crypto';
import { readFileBytesProxy } from '#gateway/node/fs__promises/read-file-bytes/read-file-bytes.proxy';
import { writeFileBytesProxy } from '#gateway/node/fs__promises/write-file-bytes/write-file-bytes.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const localImageCopyBrokerProxy = (): {
  stageCopyIds: (params: { ids: readonly unknown[] }) => void;
  sourceReads: (params: { filePath: string; bytes: Uint8Array }) => void;
  sourceReadFails: (params: { filePath: string }) => void;
  destinationWriteFails: (params: { filePath: string }) => void;
  writtenDestinations: () => string[];
  writtenBytesFor: (params: { filePath: string }) => unknown;
  sourceReadAttemptedPaths: () => unknown[];
  stderrText: () => unknown;
} => {
  const readProxy = readFileBytesProxy();
  const writeProxy = writeFileBytesProxy();
  const stderrRecorder = stderrProxy();
  const uuidHandle = registerMock({ fn: randomUUID });
  const stagedIds: unknown[] = [];

  // A destination is `<imagesDirPath>/<minted-uuid>.<ext>`, a path the caller cannot know when
  // the proxy is built. The one value the test does supply is the id it staged, so a write
  // succeeds when its file stem is one of those ids.
  writeProxy.succeedsMatchingPath({
    path: (value: unknown): boolean =>
      typeof value === 'string' && stagedIds.includes(value.split('/').pop()?.split('.')[0]),
  });

  return {
    stageCopyIds: ({ ids }: { ids: readonly unknown[] }): void => {
      // randomUUID takes no argument, so `[]` is its only address. Each id answers ONE match's
      // mint, consumed in match order: the broker mints synchronously before its first await.
      for (const id of ids) {
        stagedIds.push(id);
        uuidHandle.onceFor([]).returns(id);
      }
    },
    sourceReads: ({ filePath, bytes }: { filePath: string; bytes: Uint8Array }): void => {
      readProxy.returns({ path: filePath, bytes });
    },
    sourceReadFails: ({ filePath }: { filePath: string }): void => {
      readProxy.missing({ path: filePath });
    },
    destinationWriteFails: ({ filePath }: { filePath: string }): void => {
      writeProxy.rejects({
        path: filePath,
        error: FsErrorStub({ code: 'EACCES', path: filePath }),
      });
    },
    writtenDestinations: (): string[] =>
      writeProxy
        .getCallsFor({
          path: (value: unknown): boolean =>
            typeof value === 'string' && stagedIds.includes(value.split('/').pop()?.split('.')[0]),
        })
        .map((call) => call[0]),
    writtenBytesFor: ({ filePath }: { filePath: string }): unknown =>
      writeProxy.writtenBytesFor({ path: filePath }),
    sourceReadAttemptedPaths: (): unknown[] =>
      readProxy.getCallsFor({ path: (): boolean => true }).map((call) => String(call[0])),
    stderrText: (): unknown => stderrRecorder.getWrittenText(),
  };
};
