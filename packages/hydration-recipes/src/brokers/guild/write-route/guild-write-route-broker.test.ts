import { guildWriteRouteBroker } from './guild-write-route-broker';
import { guildWriteRouteBrokerProxy } from './guild-write-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts';

describe('guildWriteRouteBroker', () => {
  describe('a relative path in fields', () => {
    it('VALID: {name, relative path} => registers the guild at the derived absolute path', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
      });
      proxy.succeeds({
        home: '/tmp/dm-home',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        guild,
      });

      const result = await guildWriteRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1' },
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
        createdAt: guild.createdAt,
      });
    });

    it('VALID: {name, relative path} => the only directory it makes is the one inside the target', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
      });
      proxy.succeeds({
        home: '/tmp/dm-home',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1' },
      });

      expect(proxy.pathsTouched()).toStrictEqual(['/tmp/dm-home/guilds-under-test/guild-1']);
    });
  });

  describe('an already-absolute path in fields', () => {
    it('VALID: {name, absolute path} => registers the guild at that exact path', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '12345678-1234-1234-1234-123456789abc',
        name: 'Real Project',
        path: '/home/user/real-project',
        urlSlug: 'real-project',
      });
      proxy.succeeds({
        name: 'Real Project',
        path: '/home/user/real-project',
        home: '/tmp/dm-home',
        guild,
      });

      const result = await guildWriteRouteBroker({
        target,
        fields: { name: 'Real Project', path: '/home/user/real-project' },
      });

      expect(result.path).toBe('/home/user/real-project');
    });

    it('VALID: {absolute path outside the target} => registers it and makes no directory at all', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '12345678-1234-1234-1234-123456789abc',
        name: 'Real Project',
        path: '/home/user/real-project',
        urlSlug: 'real-project',
      });
      proxy.succeeds({
        name: 'Real Project',
        path: '/home/user/real-project',
        home: '/tmp/dm-home',
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Real Project', path: '/home/user/real-project' },
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });
  });

  describe('a relative path whose ".." segments escape the target', () => {
    it('VALID: {path: "../escaped-guild"} => registers the escaped path and makes no directory at all', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Escaped',
        path: '/tmp/dm-home/../escaped-guild',
        urlSlug: 'escaped',
      });
      proxy.succeeds({
        name: 'Escaped',
        path: '/tmp/dm-home/../escaped-guild',
        home: '/tmp/dm-home',
        guild,
      });

      const result = await guildWriteRouteBroker({
        target,
        fields: { name: 'Escaped', path: '../escaped-guild' },
      });

      expect(result.path).toBe('/tmp/dm-home/../escaped-guild');
      expect(proxy.pathsTouched()).toStrictEqual([]);
    });

    it('VALID: {path: "guilds-under-test/../../escaped-guild"} => makes no directory outside the target', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Escaped Deeper',
        path: '/tmp/dm-home/guilds-under-test/../../escaped-guild',
        urlSlug: 'escaped-deeper',
      });
      proxy.succeeds({
        home: '/tmp/dm-home',
        name: 'Escaped Deeper',
        path: '/tmp/dm-home/guilds-under-test/../../escaped-guild',
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Escaped Deeper', path: 'guilds-under-test/../../escaped-guild' },
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });
  });

  // A SIBLING whose name merely begins with the target's own. `/tmp/dm-home-evil` passes any
  // containment test written as `startsWith(targetRoot)`, and lands a directory next to the
  // target rather than in it — the separator is the whole difference.
  describe('a path in a sibling directory whose name starts with the target home', () => {
    it('VALID: {path: "/tmp/dm-home-evil/guild-1"} => makes no directory at all', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '55555555-5555-4555-8555-555555555555',
        name: 'Sibling',
        path: '/tmp/dm-home-evil/guild-1',
        urlSlug: 'sibling',
      });
      proxy.succeeds({
        name: 'Sibling',
        path: '/tmp/dm-home-evil/guild-1',
        home: '/tmp/dm-home',
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Sibling', path: '/tmp/dm-home-evil/guild-1' },
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });

    it('VALID: {path: "../dm-home-evil/guild-1"} => makes no directory at all', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '66666666-6666-4666-8666-666666666666',
        name: 'Sibling Fragment',
        path: '/tmp/dm-home/../dm-home-evil/guild-1',
        urlSlug: 'sibling-fragment',
      });
      proxy.succeeds({
        home: '/tmp/dm-home',
        name: 'Sibling Fragment',
        path: '/tmp/dm-home/../dm-home-evil/guild-1',
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Sibling Fragment', path: '../dm-home-evil/guild-1' },
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });
  });

  describe('a relative path whose ".." segments stay inside the target', () => {
    it('VALID: {path: "a/../guilds-under-test/guild-1"} => makes the resolved directory inside the target', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Guild 1',
        path: '/tmp/dm-home/a/../guilds-under-test/guild-1',
        urlSlug: 'guild-1',
      });
      proxy.succeeds({
        home: '/tmp/dm-home',
        name: 'Guild 1',
        path: '/tmp/dm-home/a/../guilds-under-test/guild-1',
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'a/../guilds-under-test/guild-1' },
      });

      expect(proxy.pathsTouched()).toStrictEqual(['/tmp/dm-home/guilds-under-test/guild-1']);
    });
  });

  // `guildAddBroker` resolves its own home from DUNGEONMASTER_HOME when no caller supplies one, so
  // the home this route hands down is the whole difference between a registration inside the
  // target and one in whatever dungeonmaster home the process inherited.
  describe('the home the route hands down to guildAddBroker', () => {
    it('VALID: {target home /tmp/dm-home-alpha} => registers with that exact home, not the process-wide one', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({
        home: '/tmp/dm-home-alpha',
        claudeHome: '/tmp/dm-home-alpha',
      });
      const guild = GuildStub({
        id: '77777777-7777-4777-8777-777777777777',
        name: 'Guild 1',
        path: '/tmp/dm-home-alpha/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
      });
      proxy.succeeds({
        home: '/tmp/dm-home-alpha',
        name: 'Guild 1',
        path: '/tmp/dm-home-alpha/guilds-under-test/guild-1',
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1' },
      });

      expect(proxy.registrationsMade()).toStrictEqual([
        {
          name: 'Guild 1',
          path: '/tmp/dm-home-alpha/guilds-under-test/guild-1',
          home: '/tmp/dm-home-alpha',
        },
      ]);
    });

    it('VALID: {target home /tmp/dm-home-alpha, supplied id} => registers with that home alongside the id', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({
        home: '/tmp/dm-home-alpha',
        claudeHome: '/tmp/dm-home-alpha',
      });
      const id = '88888888-8888-4888-8888-888888888888';
      const guild = GuildStub({
        id,
        name: 'Guild 1',
        path: '/tmp/dm-home-alpha/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
      });
      proxy.succeedsWithId({
        home: '/tmp/dm-home-alpha',
        name: 'Guild 1',
        path: '/tmp/dm-home-alpha/guilds-under-test/guild-1',
        id,
        guild,
      });

      await guildWriteRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1', id },
      });

      expect(proxy.registrationsMade()).toStrictEqual([
        {
          name: 'Guild 1',
          path: '/tmp/dm-home-alpha/guilds-under-test/guild-1',
          home: '/tmp/dm-home-alpha',
          id,
        },
      ]);
    });
  });

  describe('a caller-supplied id in fields', () => {
    it('VALID: {name, path, id} => registers the guild with exactly that id', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const id = '11111111-1111-1111-1111-111111111111';
      const guild = GuildStub({
        id,
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
      });
      proxy.succeedsWithId({
        home: '/tmp/dm-home',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        id,
        guild,
      });

      const result = await guildWriteRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1', id },
      });

      expect(result).toStrictEqual({
        id,
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
        createdAt: guild.createdAt,
      });
    });

    it("INVALID: {id: 'not-a-uuid'} => throws guildIdContract's own validation error", async () => {
      guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await expect(
        guildWriteRouteBroker({
          target,
          fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1', id: 'not-a-uuid' },
        }),
      ).rejects.toThrow(/Invalid uuid/u);
    });
  });
});
