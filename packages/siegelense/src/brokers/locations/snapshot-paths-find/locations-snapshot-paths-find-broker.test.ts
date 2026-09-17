import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { locationsSnapshotPathsFindBroker } from './locations-snapshot-paths-find-broker';
import { locationsSnapshotPathsFindBrokerProxy } from './locations-snapshot-paths-find-broker.proxy';
import { SnapshotOrdinalStub } from '../../../contracts/snapshot-ordinal/snapshot-ordinal.stub';

const HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });

describe('locationsSnapshotPathsFindBroker', () => {
  describe('store path resolution', () => {
    it('VALID: {homePath, ordinal: 2} => returns the store dir, the index and the numbered payload dir', () => {
      locationsSnapshotPathsFindBrokerProxy();

      const result = locationsSnapshotPathsFindBroker({
        homePath: HOME_PATH,
        ordinal: SnapshotOrdinalStub({ value: 2 }),
      });

      expect(result).toStrictEqual({
        storeDir: AbsoluteFilePathStub({
          value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots',
        }),
        index: AbsoluteFilePathStub({
          value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/index.jsonl',
        }),
        payload: AbsoluteFilePathStub({
          value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        }),
      });
    });

    it('EDGE: {ordinal: 1} => the first payload directory is numbered 1, beside the index', () => {
      locationsSnapshotPathsFindBrokerProxy();

      const result = locationsSnapshotPathsFindBroker({
        homePath: HOME_PATH,
        ordinal: SnapshotOrdinalStub({ value: 1 }),
      });

      expect(result).toStrictEqual({
        storeDir: AbsoluteFilePathStub({
          value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots',
        }),
        index: AbsoluteFilePathStub({
          value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/index.jsonl',
        }),
        payload: AbsoluteFilePathStub({
          value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        }),
      });
    });
  });

  describe('two captures never share a payload directory', () => {
    it('VALID: {ordinal: 1} vs {ordinal: 2} => the payload paths differ', () => {
      locationsSnapshotPathsFindBrokerProxy();

      const first = locationsSnapshotPathsFindBroker({
        homePath: HOME_PATH,
        ordinal: SnapshotOrdinalStub({ value: 1 }),
      });
      const second = locationsSnapshotPathsFindBroker({
        homePath: HOME_PATH,
        ordinal: SnapshotOrdinalStub({ value: 2 }),
      });

      expect([first.payload, second.payload]).toStrictEqual([
        AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1' }),
        AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2' }),
      ]);
    });
  });

  describe('two instances never share a store', () => {
    it('VALID: {two different homes} => the store directories and index paths differ', () => {
      locationsSnapshotPathsFindBrokerProxy();

      const first = locationsSnapshotPathsFindBroker({
        homePath: HOME_PATH,
        ordinal: SnapshotOrdinalStub({ value: 1 }),
      });
      const second = locationsSnapshotPathsFindBroker({
        homePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_9b2c4d1e' }),
        ordinal: SnapshotOrdinalStub({ value: 1 }),
      });

      expect([first.storeDir, second.index]).toStrictEqual([
        AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots' }),
        AbsoluteFilePathStub({
          value: '/tmp/dm-siege-inst_9b2c4d1e/.siegelense-snapshots/index.jsonl',
        }),
      ]);
    });
  });

  describe('the store sits inside the home kill removes', () => {
    it('VALID: {homePath} => the store directory is a child of the throwaway home, so it dies with the instance', () => {
      locationsSnapshotPathsFindBrokerProxy();

      const { storeDir } = locationsSnapshotPathsFindBroker({
        homePath: HOME_PATH,
        ordinal: SnapshotOrdinalStub({ value: 1 }),
      });

      expect(storeDir).toBe('/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots');
    });
  });
});
