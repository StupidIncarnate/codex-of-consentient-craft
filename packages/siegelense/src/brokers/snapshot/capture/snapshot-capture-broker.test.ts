import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { snapshotCaptureBroker } from './snapshot-capture-broker';
import { snapshotCaptureBrokerProxy } from './snapshot-capture-broker.proxy';
import { SnapshotNameStub } from '../../../contracts/snapshot-name/snapshot-name.stub';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

const HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });
const CAPTURE_AT_MS = 1735689600000;

describe('snapshotCaptureBroker', () => {
  describe('the first capture on an instance', () => {
    it('VALID: {name: clean, manual: true} => returns the record it wrote, pointing at payload directory 1', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME_PATH });

      const result = await snapshotCaptureBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'clean' }),
        manual: true,
      });

      expect(result).toStrictEqual({
        name: 'clean',
        atMs: CAPTURE_AT_MS,
        manual: true,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
      });
    });

    it('VALID: {name: run_1:start, manual: false} => appends exactly one index line holding that record', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME_PATH });

      await snapshotCaptureBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'run_1:start' }),
        manual: false,
      });

      expect(proxy.appendedRecordsFor({ homePath: HOME_PATH })).toStrictEqual([
        {
          name: 'run_1:start',
          atMs: CAPTURE_AT_MS,
          manual: false,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        },
      ]);
    });

    it("VALID: {name: clean} => copies the home's children into the payload directory, and never the store itself", async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME_PATH });

      await snapshotCaptureBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'clean' }),
        manual: true,
      });

      expect(proxy.copiedPairs()).toStrictEqual([
        [
          '/tmp/dm-siege-inst_7f3a9c21/guilds',
          '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1/guilds',
        ],
      ]);
    });
  });

  describe('a second capture on the same instance', () => {
    it('VALID: {store already holding one record} => the new payload directory is 2, not 1', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
        records: [
          SnapshotRecordStub({
            name: 'run_1:start',
            atMs: 1000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
        ],
      });

      const result = await snapshotCaptureBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'run_1:end' }),
        manual: false,
      });

      expect(result).toStrictEqual({
        name: 'run_1:end',
        atMs: CAPTURE_AT_MS,
        manual: false,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
      });
    });

    it('VALID: {re-capturing an existing name} => writes a NEW payload directory rather than overwriting the first', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
        records: [
          SnapshotRecordStub({
            name: 'clean',
            atMs: 1000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
        ],
      });
      proxy.setupClock({ nowMs: 9000 });

      const result = await snapshotCaptureBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'clean' }),
        manual: true,
      });

      expect(result).toStrictEqual({
        name: 'clean',
        atMs: 9000,
        manual: true,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
      });
    });
  });

  describe('the automatic namespace is closed to a typed name', () => {
    it('INVALID: {name: "mine:start", manual: true} => throws naming both reserved suffixes', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME_PATH });

      await expect(
        snapshotCaptureBroker({
          homePath: HOME_PATH,
          name: SnapshotNameStub({ value: 'mine:start' }),
          manual: true,
        }),
      ).rejects.toThrow(
        /Snapshot name "mine:start" ends in a suffix reserved for the automatic pair \(:start, :end\)/u,
      );
    });

    it('INVALID: {name: "mine:end", manual: true} => throws, so the end half is closed too', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME_PATH });

      await expect(
        snapshotCaptureBroker({
          homePath: HOME_PATH,
          name: SnapshotNameStub({ value: 'mine:end' }),
          manual: true,
        }),
      ).rejects.toThrow(/reserved for the automatic pair/u);
    });

    it('VALID: {name: "run_1:start", manual: false} => the run itself is allowed into its own namespace', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME_PATH });

      const result = await snapshotCaptureBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'run_1:start' }),
        manual: false,
      });

      expect(result).toStrictEqual({
        name: 'run_1:start',
        atMs: CAPTURE_AT_MS,
        manual: false,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
      });
    });

    it('VALID: {name: "clean", manual: true} => a typed name outside the namespace is accepted', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME_PATH });

      const result = await snapshotCaptureBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'clean' }),
        manual: true,
      });

      expect(result).toStrictEqual({
        name: 'clean',
        atMs: CAPTURE_AT_MS,
        manual: true,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
      });
    });
  });

  describe('a copy that fails', () => {
    it('ERROR: {fs.cp rejects} => propagates the failure', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupCopyFails({
        homePath: HOME_PATH,
        error: new Error('ENOSPC: no space left on device'),
      });

      await expect(
        snapshotCaptureBroker({
          homePath: HOME_PATH,
          name: SnapshotNameStub({ value: 'clean' }),
          manual: true,
        }),
      ).rejects.toThrow(/ENOSPC/u);
    });

    it('ERROR: {fs.cp rejects} => appends NO index line, so the list never advertises a restore point that is not on disk', async () => {
      const proxy = snapshotCaptureBrokerProxy();
      proxy.setupCopyFails({
        homePath: HOME_PATH,
        error: new Error('ENOSPC: no space left on device'),
      });

      await expect(
        snapshotCaptureBroker({
          homePath: HOME_PATH,
          name: SnapshotNameStub({ value: 'clean' }),
          manual: true,
        }),
      ).rejects.toThrow(/ENOSPC/u);

      expect(proxy.appendedRecordsFor({ homePath: HOME_PATH })).toStrictEqual([]);
    });
  });
});
