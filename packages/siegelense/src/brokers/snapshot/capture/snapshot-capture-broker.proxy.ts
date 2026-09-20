import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsCpAdapterProxy } from '../../../adapters/fs/cp/fs-cp-adapter.proxy';
import { locationsSnapshotPathsFindBrokerProxy } from '../../locations/snapshot-paths-find/locations-snapshot-paths-find-broker.proxy';
import { snapshotIndexReadBrokerProxy } from '../index-read/snapshot-index-read-broker.proxy';
import { snapshotStatics } from '../../../statics/snapshot/snapshot-statics';
import type { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

type SnapshotRecord = ReturnType<typeof SnapshotRecordStub>;

const CAPTURE_AT_MS = 1735689600000;
// Hand-concatenated from the resolver's own known parts, never by calling the real resolver during
// setup — see snapshot-index-read-broker.proxy.ts's own comment for why a real `pathJoinAdapter` call
// at test-setup time is a hazard in this package.
const STORE_DIR_NAME = snapshotStatics.store.dirName;
// What a staged home holds, alongside the store itself. The store name is deliberately in the list:
// it is what the exclusion has to drop, and `copiedPairs()` never showing it is the proof.
const HOME_ENTRIES = ['guilds', STORE_DIR_NAME] as const;

export const snapshotCaptureBrokerProxy = (): {
  setupClock: (params: { nowMs: number }) => void;
  setupEmptyStore: (params: { homePath: AbsoluteFilePath }) => void;
  setupStoreHolding: (params: {
    homePath: AbsoluteFilePath;
    records: readonly SnapshotRecord[];
  }) => void;
  setupCopyFails: (params: { homePath: AbsoluteFilePath; error: Error }) => void;
  payloadPathFor: (params: { homePath: AbsoluteFilePath; ordinal: number }) => AbsoluteFilePath;
  storeDirFor: (params: { homePath: AbsoluteFilePath }) => AbsoluteFilePath;
  indexPathFor: (params: { homePath: AbsoluteFilePath }) => AbsoluteFilePath;
  appendedRecordsFor: (params: { homePath: AbsoluteFilePath }) => unknown[];
  copiedPairs: () => unknown[][];
} => {
  // Pure — runs real. Constructed for enforce-proxy-child-creation.
  locationsSnapshotPathsFindBrokerProxy();
  // Its own constructor resolves ANY filepath, so there is nothing to address here.
  fsMkdirAdapterProxy();

  const indexReadProxy = snapshotIndexReadBrokerProxy();
  const cpProxy = fsCpAdapterProxy();
  const appendProxy = fsAppendFileAdapterProxy();

  // `Date.now` takes no argument, so `calledWith([])` is the honest address rather than a lazy
  // catch-all. The default is staged by each setup method below rather than by this constructor: a
  // PARENT proxy composing this one (run-execute-broker.proxy.ts) never calls those methods, and a
  // constructor-level registration on this shared spy would otherwise overwrite the clock its own
  // step layer staged.
  const nowHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupClock: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },

    // No index file yet: the next payload directory is the first one.
    setupEmptyStore: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      nowHandle.calledWith([]).returns(CAPTURE_AT_MS);
      indexReadProxy.setupNoIndex({ homePath });
      appendProxy.succeeds({ filePath: indexReadProxy.indexPathFor({ homePath }) });
      cpProxy.succeeds({
        sourcePath: homePath,
        destinationPath: AbsoluteFilePathStub({
          value: `${String(homePath)}/${STORE_DIR_NAME}/${String(snapshotStatics.numbering.firstPayload)}`,
        }),
        entries: HOME_ENTRIES,
      });
    },

    // An index already holding N records: the next payload directory is N + 1.
    setupStoreHolding: ({
      homePath,
      records,
    }: {
      homePath: AbsoluteFilePath;
      records: readonly SnapshotRecord[];
    }): void => {
      nowHandle.calledWith([]).returns(CAPTURE_AT_MS);
      indexReadProxy.setupIndex({ homePath, records });
      appendProxy.succeeds({ filePath: indexReadProxy.indexPathFor({ homePath }) });
      cpProxy.succeeds({
        sourcePath: homePath,
        destinationPath: AbsoluteFilePathStub({
          value: `${String(homePath)}/${STORE_DIR_NAME}/${String(records.length + snapshotStatics.numbering.firstPayload)}`,
        }),
        entries: HOME_ENTRIES,
      });
    },

    // The copy into an EMPTY store fails — so a test can prove no index line is appended.
    setupCopyFails: ({ homePath, error }: { homePath: AbsoluteFilePath; error: Error }): void => {
      nowHandle.calledWith([]).returns(CAPTURE_AT_MS);
      indexReadProxy.setupNoIndex({ homePath });
      appendProxy.succeeds({ filePath: indexReadProxy.indexPathFor({ homePath }) });
      cpProxy.throws({
        sourcePath: homePath,
        destinationPath: AbsoluteFilePathStub({
          value: `${String(homePath)}/${STORE_DIR_NAME}/${String(snapshotStatics.numbering.firstPayload)}`,
        }),
        entries: HOME_ENTRIES,
        error,
      });
    },

    payloadPathFor: ({
      homePath,
      ordinal,
    }: {
      homePath: AbsoluteFilePath;
      ordinal: number;
    }): AbsoluteFilePath =>
      AbsoluteFilePathStub({
        value: `${String(homePath)}/${STORE_DIR_NAME}/${String(ordinal)}`,
      }),

    storeDirFor: ({ homePath }: { homePath: AbsoluteFilePath }): AbsoluteFilePath =>
      AbsoluteFilePathStub({ value: `${String(homePath)}/${STORE_DIR_NAME}` }),

    indexPathFor: ({ homePath }: { homePath: AbsoluteFilePath }): AbsoluteFilePath =>
      indexReadProxy.indexPathFor({ homePath }),

    // Every line appended to this instance's index, in call order, parsed back from JSON so a test
    // asserts the RECORD rather than a string it has to re-encode by hand.
    appendedRecordsFor: ({ homePath }: { homePath: AbsoluteFilePath }): unknown[] =>
      appendProxy
        .getAppendedFor({ filePath: indexReadProxy.indexPathFor({ homePath }) })
        .map((line) => JSON.parse(String(line))),

    copiedPairs: (): unknown[][] => cpProxy.getCopiedPairs(),
  };
};
