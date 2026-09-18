import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { SnapshotNameStub } from '../../../contracts/snapshot-name/snapshot-name.stub';
import { stepSnapshotBroker } from './step-snapshot-broker';
import { stepSnapshotBrokerProxy } from './step-snapshot-broker.proxy';

const HOME = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_snapshot' });

describe('stepSnapshotBroker', () => {
  describe('capturing a snapshot', () => {
    it('VALID: {lane, as: "clean"} => captures manual snapshot and returns reading', async () => {
      const proxy = stepSnapshotBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME });

      const lane = LaneSessionStub({ homePath: HOME });
      const as = SnapshotNameStub({ value: 'clean' });

      const reading = await stepSnapshotBroker({ lane, as });

      expect(reading).toBe('snapshot "clean" recorded');
      expect(proxy.appendedRecordsFor({ homePath: HOME })).toStrictEqual([
        {
          name: 'clean',
          atMs: 1735689600000,
          manual: true,
          path: '/tmp/dm-siege-inst_snapshot/.siegelense-snapshots/1',
        },
      ]);
    });

    it('VALID: {lane.browser === null} => runs identically on browserless lane', async () => {
      const proxy = stepSnapshotBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME });

      const lane = LaneSessionStub({ homePath: HOME, browser: null });
      const as = SnapshotNameStub({ value: 'after-cycle-1' });

      const reading = await stepSnapshotBroker({ lane, as });

      expect(reading).toBe('snapshot "after-cycle-1" recorded');
      expect(proxy.appendedRecordsFor({ homePath: HOME })).toStrictEqual([
        {
          name: 'after-cycle-1',
          atMs: 1735689600000,
          manual: true,
          path: '/tmp/dm-siege-inst_snapshot/.siegelense-snapshots/1',
        },
      ]);
    });
  });

  describe('adversarial / reserved names', () => {
    it('INVALID: {as: "foo:start"} => throws when name ends with reserved startSuffix', async () => {
      const proxy = stepSnapshotBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME });

      const lane = LaneSessionStub({ homePath: HOME });
      const as = SnapshotNameStub({ value: 'foo:start' });

      await expect(stepSnapshotBroker({ lane, as })).rejects.toThrow(
        /ends in a suffix reserved for the automatic pair/u,
      );
    });

    it('INVALID: {as: "bar:end"} => throws when name ends with reserved endSuffix', async () => {
      const proxy = stepSnapshotBrokerProxy();
      proxy.setupEmptyStore({ homePath: HOME });

      const lane = LaneSessionStub({ homePath: HOME });
      const as = SnapshotNameStub({ value: 'bar:end' });

      await expect(stepSnapshotBroker({ lane, as })).rejects.toThrow(
        /ends in a suffix reserved for the automatic pair/u,
      );
    });
  });
});
