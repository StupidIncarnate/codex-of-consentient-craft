import { sessionWriteRouteBroker } from './session-write-route-broker';
import { sessionWriteRouteBrokerProxy } from './session-write-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

describe('sessionWriteRouteBroker', () => {
  describe('a single line', () => {
    it('VALID: {sessionId, cwd, lines} => appends the line and returns a SessionRecord with lineCount 1', async () => {
      const proxy = sessionWriteRouteBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      const filePath = '/tmp/guild-1/.claude/projects/-tmp-guild-1/seed-session-1.jsonl';
      proxy.succeeds({ filePath });

      const result = await sessionWriteRouteBroker({
        target,
        fields: {
          sessionId: 'seed-session-1',
          cwd: '/tmp/guild-1',
          lines: ['{"type":"user","message":{"role":"user","content":"hello"}}'],
        },
      });

      expect(result).toStrictEqual({
        sessionId: 'seed-session-1',
        cwd: '/tmp/guild-1',
        filePath,
        lineCount: 1,
      });
      expect(proxy.getAppendedContents({ filePath })).toBe(
        '{"type":"user","message":{"role":"user","content":"hello"}}\n',
      );
    });
  });
});
