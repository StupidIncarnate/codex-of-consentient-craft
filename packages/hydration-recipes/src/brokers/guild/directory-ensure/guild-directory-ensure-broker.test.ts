import { guildDirectoryEnsureBroker } from './guild-directory-ensure-broker';
import { guildDirectoryEnsureBrokerProxy } from './guild-directory-ensure-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildPathStub } from '@dungeonmaster/shared/contracts';

describe('guildDirectoryEnsureBroker', () => {
  describe('a path inside the target', () => {
    it('VALID: {path: target.home + relative fragment} => makes the resolved directory', async () => {
      const proxy = guildDirectoryEnsureBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await guildDirectoryEnsureBroker({
        target,
        path: GuildPathStub({ value: '/tmp/dm-home/guilds-under-test/guild-1' }),
      });

      expect(proxy.pathsTouched()).toStrictEqual(['/tmp/dm-home/guilds-under-test/guild-1']);
    });
  });

  describe('an already-absolute path outside the target', () => {
    it('VALID: {path: a real project directory} => makes no directory at all', async () => {
      const proxy = guildDirectoryEnsureBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await guildDirectoryEnsureBroker({
        target,
        path: GuildPathStub({ value: '/home/user/real-project' }),
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });
  });

  // A SIBLING of the target whose name merely begins with it — the case any containment check
  // written as `startsWith(target.home)` waves through instead of refusing.
  describe('a path in a sibling directory whose name starts with the target home', () => {
    it('VALID: {path: "/tmp/dm-home-evil/guild-1"} => makes no directory at all', async () => {
      const proxy = guildDirectoryEnsureBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await guildDirectoryEnsureBroker({
        target,
        path: GuildPathStub({ value: '/tmp/dm-home-evil/guild-1' }),
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });
  });

  describe('a path whose ".." segments escape the target', () => {
    it('VALID: {path: "/tmp/dm-home/../escaped-guild"} => makes no directory at all', async () => {
      const proxy = guildDirectoryEnsureBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await guildDirectoryEnsureBroker({
        target,
        path: GuildPathStub({ value: '/tmp/dm-home/../escaped-guild' }),
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });
  });
});
