import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';
import { SnapshotsAnswerStub } from '../../../contracts/snapshots-answer/snapshots-answer.stub';
import { SnapshotIndexUnreadableError } from '../../../errors/snapshot-index-unreadable/snapshot-index-unreadable-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

import { SiegelenseSnapshotsResponder } from './siegelense-snapshots-responder';
import { SiegelenseSnapshotsResponderProxy } from './siegelense-snapshots-responder.proxy';

describe('SiegelenseSnapshotsResponder', () => {
  describe('an instance holding snapshots', () => {
    it('VALID: {four automatic rows} => writes the complete SnapshotsAnswer as one JSON document', async () => {
      const proxy = SiegelenseSnapshotsResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const answer = SnapshotsAnswerStub({
        instanceId,
        instanceState: 'alive',
        snapshots: [
          SnapshotRecordStub({
            name: 'run_1:start',
            atMs: 1000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
          SnapshotRecordStub({
            name: 'run_1:end',
            atMs: 2000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          }),
        ],
      });
      proxy.stageAnswer({ answer });

      await SiegelenseSnapshotsResponder({ instanceId });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('an instance id nobody recognises', () => {
    it('EMPTY: {instanceState unknown} => still writes a document and never throws', async () => {
      const proxy = SiegelenseSnapshotsResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const answer = SnapshotsAnswerStub({
        instanceId,
        instanceState: 'unknown',
        snapshots: [],
      });
      proxy.stageAnswer({ answer });

      const result = await SiegelenseSnapshotsResponder({ instanceId });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('an index that exists and cannot be parsed', () => {
    it('ERROR: {SnapshotIndexUnreadableError} => propagates and stdout stays empty', async () => {
      const proxy = SiegelenseSnapshotsResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const error = new SnapshotIndexUnreadableError({
        indexPath: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/index.jsonl',
        cause: new Error('Unexpected end of JSON input'),
      });
      proxy.stageError({ error });

      await expect(SiegelenseSnapshotsResponder({ instanceId })).rejects.toStrictEqual(error);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });
});
