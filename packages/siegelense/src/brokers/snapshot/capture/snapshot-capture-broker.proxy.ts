import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '#gateway/node/fs';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import { copyDirContentsProxy } from '#gateway/node/fs__promises/copy-dir-contents/copy-dir-contents.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';

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
// it is what the exclusion has to drop, and `copiedFor` showing no copy of it is the proof.
const HOME_ENTRIES = ['guilds', STORE_DIR_NAME] as const;
// A failing copy needs two entries the exclusion keeps: the first lands, the second fails.
const FAILING_HOME_ENTRIES = ['guilds', 'claude-queue'] as const;

export const snapshotCaptureBrokerProxy = (): {
  setupClock: (params: { nowMs: number }) => void;
  setupEmptyStore: (params: { homePath: string }) => void;
  setupStoreHolding: (params: {
    homePath: string;
    records: readonly SnapshotRecord[];
  }) => void;
  setupCopyFails: (params: { homePath: string; error: FsError }) => void;
  payloadPathFor: (params: { homePath: string; ordinal: number }) => string;
  storeDirFor: (params: { homePath: string }) => string;
  indexPathFor: (params: { homePath: string }) => string;
  appendedRecordsFor: (params: { homePath: string }) => unknown[];
  copiedFor: (params: { homePath: string; entry: string }) => unknown;
} => {
  // Pure — runs real. Constructed for enforce-proxy-child-creation.
  locationsSnapshotPathsFindBrokerProxy();
  // Unlike the old shared fsMkdirAdapter, ensureDirProxy has no permissive default — each setup
  // method below addresses it at the exact storeDir and payload paths it already computes for cp.
  const mkdirProxy = ensureDirProxy();

  const indexReadProxy = snapshotIndexReadBrokerProxy();
  const cpProxy = copyDirContentsProxy();
  const appendProxy = appendFileProxy();

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
    setupEmptyStore: ({ homePath }: { homePath: string }): void => {
      nowHandle.calledWith([]).returns(CAPTURE_AT_MS);
      indexReadProxy.setupNoIndex({ homePath });
      appendProxy.succeeds({ path: indexReadProxy.indexPathFor({ homePath }) });
      const payloadValue = `${String(homePath)}/${STORE_DIR_NAME}/${String(snapshotStatics.numbering.firstPayload)}`;
      mkdirProxy.succeeds({ path: `${String(homePath)}/${STORE_DIR_NAME}` });
      mkdirProxy.succeeds({ path: payloadValue });
      cpProxy.succeeds({ from: homePath, entries: HOME_ENTRIES });
    },

    // An index already holding N records: the next payload directory is N + 1.
    setupStoreHolding: ({
      homePath,
      records,
    }: {
      homePath: string;
      records: readonly SnapshotRecord[];
    }): void => {
      nowHandle.calledWith([]).returns(CAPTURE_AT_MS);
      indexReadProxy.setupIndex({ homePath, records });
      appendProxy.succeeds({ path: indexReadProxy.indexPathFor({ homePath }) });
      const payloadValue = `${String(homePath)}/${STORE_DIR_NAME}/${String(records.length + snapshotStatics.numbering.firstPayload)}`;
      mkdirProxy.succeeds({ path: `${String(homePath)}/${STORE_DIR_NAME}` });
      mkdirProxy.succeeds({ path: payloadValue });
      cpProxy.succeeds({ from: homePath, entries: HOME_ENTRIES });
    },

    // The copy into an EMPTY store fails — so a test can prove no index line is appended.
    setupCopyFails: ({ homePath, error }: { homePath: string; error: FsError }): void => {
      nowHandle.calledWith([]).returns(CAPTURE_AT_MS);
      indexReadProxy.setupNoIndex({ homePath });
      appendProxy.succeeds({ path: indexReadProxy.indexPathFor({ homePath }) });
      const payloadValue = `${String(homePath)}/${STORE_DIR_NAME}/${String(snapshotStatics.numbering.firstPayload)}`;
      mkdirProxy.succeeds({ path: `${String(homePath)}/${STORE_DIR_NAME}` });
      mkdirProxy.succeeds({ path: payloadValue });
      cpProxy.secondEntryFails({
        from: homePath,
        to: payloadValue,
        entries: FAILING_HOME_ENTRIES,
        error,
      });
    },

    payloadPathFor: ({
      homePath,
      ordinal,
    }: {
      homePath: string;
      ordinal: number;
    }): string =>
      `${String(homePath)}/${STORE_DIR_NAME}/${String(ordinal)}`,

    storeDirFor: ({ homePath }: { homePath: string }): string =>
      `${String(homePath)}/${STORE_DIR_NAME}`,

    indexPathFor: ({ homePath }: { homePath: string }): string =>
      indexReadProxy.indexPathFor({ homePath }),

    // Every line appended to this instance's index, in call order, parsed back from JSON so a test
    // asserts the RECORD rather than a string it has to re-encode by hand.
    appendedRecordsFor: ({ homePath }: { homePath: string }): unknown[] =>
      appendProxy
        .getCallsFor({ path: indexReadProxy.indexPathFor({ homePath }) })
        .map((call) => JSON.parse(String(call[1]))),

    // Every cp of one child of the home, in call order, as [source, destination, options].
    copiedFor: ({ homePath, entry }: { homePath: string; entry: string }): unknown =>
      cpProxy.cpCallsFor({ source: `${String(homePath)}/${entry}` }),
  };
};
