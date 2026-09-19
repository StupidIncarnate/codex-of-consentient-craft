import { sessionRemoveRouteBroker } from './session-remove-route-broker';
import { sessionRemoveRouteBrokerProxy } from './session-remove-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

describe('sessionRemoveRouteBroker', () => {
  describe('an existing session record', () => {
    it('VALID: {record} => removes the file at record.filePath', async () => {
      const proxy = sessionRemoveRouteBrokerProxy();
      const target = DmTargetStub({});
      const filePath = '/tmp/guild-1/.claude/projects/-tmp-guild-1/seed-session-1.jsonl';
      proxy.succeeds({ filePath });

      const result = await sessionRemoveRouteBroker({
        target,
        record: { sessionId: 'seed-session-1', cwd: '/tmp/guild-1', filePath, lineCount: 1 },
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
