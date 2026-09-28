import { sessionUniqueIdResolveBroker } from './session-unique-id-resolve-broker';
import { sessionUniqueIdResolveBrokerProxy } from './session-unique-id-resolve-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { AbsoluteFilePathStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

describe('sessionUniqueIdResolveBroker', () => {
  describe('the default id, free', () => {
    it('VALID: {sessionId: "seed-session-1", nothing on disk} => returns it unchanged', () => {
      sessionUniqueIdResolveBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });

      const result = sessionUniqueIdResolveBroker({
        target,
        cwd: AbsoluteFilePathStub({ value: '/tmp/guild-1' }),
        sessionId: SessionIdStub({ value: 'seed-session-1' }),
      });

      expect(result).toBe('seed-session-1');
    });
  });

  describe('the default id, already occupied', () => {
    it('VALID: {seed-session-1.jsonl already on disk} => bumps to seed-session-2', () => {
      const proxy = sessionUniqueIdResolveBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      proxy.setupExisting({
        filePaths: ['/tmp/guild-1/.claude/projects/-tmp-guild-1/seed-session-1.jsonl'],
      });

      const result = sessionUniqueIdResolveBroker({
        target,
        cwd: AbsoluteFilePathStub({ value: '/tmp/guild-1' }),
        sessionId: SessionIdStub({ value: 'seed-session-1' }),
      });

      expect(result).toBe('seed-session-2');
    });

    it('VALID: {seed-session-1 AND seed-session-2 already on disk} => bumps to seed-session-3', () => {
      const proxy = sessionUniqueIdResolveBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      proxy.setupExisting({
        filePaths: [
          '/tmp/guild-1/.claude/projects/-tmp-guild-1/seed-session-1.jsonl',
          '/tmp/guild-1/.claude/projects/-tmp-guild-1/seed-session-2.jsonl',
        ],
      });

      const result = sessionUniqueIdResolveBroker({
        target,
        cwd: AbsoluteFilePathStub({ value: '/tmp/guild-1' }),
        sessionId: SessionIdStub({ value: 'seed-session-1' }),
      });

      expect(result).toBe('seed-session-3');
    });
  });

  describe('a custom id not matching the default shape', () => {
    it('VALID: {sessionId: "my-custom-session"} => returns it unchanged, whether or not it exists', () => {
      const proxy = sessionUniqueIdResolveBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      proxy.setupExisting({
        filePaths: ['/tmp/guild-1/.claude/projects/-tmp-guild-1/my-custom-session.jsonl'],
      });

      const result = sessionUniqueIdResolveBroker({
        target,
        cwd: AbsoluteFilePathStub({ value: '/tmp/guild-1' }),
        sessionId: SessionIdStub({ value: 'my-custom-session' }),
      });

      expect(result).toBe('my-custom-session');
    });
  });
});
