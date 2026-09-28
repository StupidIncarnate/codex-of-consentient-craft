import { writeFileBytes } from '#gateway/node/fs__promises';
import { readFileBytesProxy } from '#gateway/node/fs__promises/read-file-bytes/read-file-bytes.proxy';
import { writeFileBytesProxy } from '#gateway/node/fs__promises/write-file-bytes/write-file-bytes.proxy';
import { join } from '#gateway/node/path';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// A real uuid's textual length — the one real fact every destination localImageCopyBroker mints
// shares, used below to address its write without hardcoding the digit count.
const MINTED_ID_LENGTH = '00000000-0000-0000-0000-000000000000'.length;

export const localImageCopyBrokerProxy = (): {
  stageCopyIds: (params: { ids: readonly string[] }) => void;
  sourceReads: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  sourceReadFails: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  destinationWriteFails: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  writtenDestinations: () => AbsoluteFilePath[];
  writtenBytesFor: (params: { filePath: AbsoluteFilePath }) => unknown;
  sourceReadAttemptedPaths: () => unknown[];
} => {
  const readProxy = readFileBytesProxy();
  writeFileBytesProxy(); // satisfies enforce-proxy-child-creation; this broker's real writes are
  // mocked directly on `writeFileBytes` below, not through this child proxy's own exact-path-only
  // `succeeds`/`rejects`.
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID' });
  const writeFileBytesHandle = registerMock({ fn: writeFileBytes });
  // Every destination this broker writes to is `<imagesDirPath>/<freshly-minted-uuid>.<ext>` — a
  // path the caller cannot know at proxy-construction time. writeFileBytesProxy's own
  // succeeds/rejects take only an exact literal path (no matching-path variant, unlike its
  // read-shaped siblings), so success is staged directly on the gateway's own writeFileBytes
  // export instead, addressed by the one real structural fact every such destination shares: its
  // basename's stem is uuid-length — mirrors chat-subagent-tail-broker.proxy.ts's
  // predicate-on-ensureDir pattern for the same reason.
  writeFileBytesHandle
    .calledWith([
      (value: unknown): boolean =>
        typeof value === 'string' &&
        (value.split('/').pop()?.split('.')[0]?.length ?? 0) === MINTED_ID_LENGTH,
    ])
    .resolves(undefined);

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
      readProxy.returns({ path: filePath, bytes });
    },
    sourceReadFails: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      // readFileBytesProxy's throwsMatchingPath demands an FsError (a coded, recorded failure —
      // G19 bans a catch-all Error), stamped from the caller-supplied Error's own message, per
      // this codebase's `'<CODE>: <detail>'` convention.
      readProxy.throwsMatchingPath({
        path: filePath,
        error: Object.assign(error, { code: error.message.split(':')[0] ?? 'UNKNOWN' }),
      });
    },
    destinationWriteFails: ({
      filePath,
      error,
    }: {
      filePath: AbsoluteFilePath;
      error: Error;
    }): void => {
      // An EXACT address registered after the predicate-based success default above — most
      // specific (and most recent) wins, so this one destination fails while every other minted
      // destination still succeeds.
      writeFileBytesHandle
        .calledWith([filePath])
        .rejects(Object.assign(error, { code: error.message.split(':')[0] ?? 'UNKNOWN' }));
    },
    writtenDestinations: (): AbsoluteFilePath[] =>
      writeFileBytesHandle.callsMatching([]).map((call) => absoluteFilePathContract.parse(call[0])),
    writtenBytesFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      writeFileBytesHandle.callsMatching([filePath]).at(-1)?.[1],
    // Every path localImageCopyBroker actually attempted to read, in call order — the accept-all
    // predicate here is a READ-BACK, not a staged answer, so it is not the banned catch-all.
    sourceReadAttemptedPaths: (): unknown[] =>
      readProxy.getCallsFor({ path: (): boolean => true }).map((call) => String(call[0])),
  };
};
