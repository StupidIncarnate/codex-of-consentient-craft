import { sessionQueryRouteBroker } from './session-query-route-broker';
import { sessionQueryRouteBrokerProxy } from './session-query-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

describe('sessionQueryRouteBroker', () => {
  describe('two sessions under one guild', () => {
    it('VALID: {where: {cwd}} => returns both session ids', () => {
      const proxy = sessionQueryRouteBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      const sessionsDir = '/tmp/guild-1/.claude/projects/-tmp-guild-1';
      proxy.succeeds({
        sessionsDir,
        fileNames: ['seed-session-1.jsonl', 'seed-session-2.jsonl'],
        lineCountByFileName: { 'seed-session-1.jsonl': 1, 'seed-session-2.jsonl': 2 },
      });

      const result = sessionQueryRouteBroker({ target, where: { cwd: '/tmp/guild-1' } });

      expect(result.map((record) => record.sessionId)).toStrictEqual([
        'seed-session-1',
        'seed-session-2',
      ]);
    });
  });
});
