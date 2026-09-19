import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { SnapshotRecordStub } from '../../contracts/snapshot-record/snapshot-record.stub';
import { SnapshotsAnswerStub } from '../../contracts/snapshots-answer/snapshots-answer.stub';
import { snapshotsAnswerRenderTransformer } from './snapshots-answer-render-transformer';

describe('snapshotsAnswerRenderTransformer', () => {
  describe('an instance with no snapshots', () => {
    it('EMPTY: {snapshots: []} => renders none recorded yet sentence', () => {
      const answer = SnapshotsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: 'alive',
        snapshots: [],
      });

      const result = snapshotsAnswerRenderTransformer({ answer });

      expect(result).toBe('INSTANCE: inst_7f3a9c21 (alive)\nSNAPSHOTS: none recorded yet\n');
    });
  });

  describe('an instance holding snapshots', () => {
    it('VALID: {snapshots with nowMs} => renders aligned box-drawing table with computed age', () => {
      const nowMs = EpochMsStub({ value: 100_000 });
      const answer = SnapshotsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: 'alive',
        snapshots: [
          SnapshotRecordStub({
            name: 'run_1:start',
            atMs: 40_000,
            manual: false,
          }),
          SnapshotRecordStub({
            name: 'clean',
            atMs: 80_000,
            manual: true,
          }),
        ],
      });

      const result = snapshotsAnswerRenderTransformer({ answer, nowMs });

      const expected =
        'INSTANCE: inst_7f3a9c21 (alive)\n' +
        '┌─────────────┬─────┬────────┐\n' +
        '│ NAME        │ AGE │ MANUAL │\n' +
        '├─────────────┼─────┼────────┤\n' +
        '│ run_1:start │ 1m  │ false  │\n' +
        '│ clean       │ 20s │ true   │\n' +
        '└─────────────┴─────┴────────┘\n';

      expect(result).toBe(expected);
    });

    it('VALID: {snapshots with explicit age, no nowMs} => renders aligned box-drawing table with explicit age', () => {
      const answer = SnapshotsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: 'alive',
        snapshots: [
          SnapshotRecordStub({
            name: 'run_1:start',
            atMs: 0,
            manual: false,
            age: '5m',
          }),
        ],
      });

      const result = snapshotsAnswerRenderTransformer({ answer });

      const expected =
        'INSTANCE: inst_7f3a9c21 (alive)\n' +
        '┌─────────────┬─────┬────────┐\n' +
        '│ NAME        │ AGE │ MANUAL │\n' +
        '├─────────────┼─────┼────────┤\n' +
        '│ run_1:start │ 5m  │ false  │\n' +
        '└─────────────┴─────┴────────┘\n';

      expect(result).toBe(expected);
    });
  });
});
