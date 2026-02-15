import {
  GuildConfigStub,
  GuildIdStub,
  GuildNameStub,
  GuildPathStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';

import { guildUpdateBroker } from './guild-update-broker';
import { guildUpdateBrokerProxy } from './guild-update-broker.proxy';

describe('guildUpdateBroker', () => {
  describe('successful update', () => {
    it('VALID: {guildId, name} => returns guild with updated name', async () => {
      const proxy = guildUpdateBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({
        id: guildId,
        name: 'Old Name',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const newName = GuildNameStub({ value: 'New Name' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await guildUpdateBroker({ guildId, name: newName });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Name',
        path: '/home/user/my-app',
        urlSlug: 'my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
        chatSessions: [],
      });
    });

    it('VALID: {guildId, path} => returns guild with updated path', async () => {
      const proxy = guildUpdateBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({
        id: guildId,
        name: 'My App',
        path: '/home/user/old-path',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const newPath = GuildPathStub({ value: '/home/user/new-path' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await guildUpdateBroker({ guildId, path: newPath });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/new-path',
        urlSlug: 'my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
        chatSessions: [],
      });
    });

    it('VALID: {guildId, name, path} => returns guild with both updated', async () => {
      const proxy = guildUpdateBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({
        id: guildId,
        name: 'Old Name',
        path: '/home/user/old-path',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const newName = GuildNameStub({ value: 'New Name' });
      const newPath = GuildPathStub({ value: '/home/user/new-path' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await guildUpdateBroker({ guildId, name: newName, path: newPath });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Name',
        path: '/home/user/new-path',
        urlSlug: 'my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
        chatSessions: [],
      });
    });

    it('VALID: {guildId among multiple guilds} => updates only matching guild', async () => {
      const proxy = guildUpdateBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const guild1 = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First Guild',
        path: '/home/user/first',
      });
      const guild2 = GuildStub({
        id: guildId,
        name: 'Second Guild',
        path: '/home/user/second',
        createdAt: '2024-02-20T12:00:00.000Z',
      });
      const newName = GuildNameStub({ value: 'Updated Second' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild1, guild2] }),
      });

      const result = await guildUpdateBroker({ guildId, name: newName });

      expect(result).toStrictEqual({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Updated Second',
        path: '/home/user/second',
        urlSlug: 'my-guild',
        createdAt: '2024-02-20T12:00:00.000Z',
        chatSessions: [],
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {guildId not in config} => throws guild not found', async () => {
      const proxy = guildUpdateBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const newName = GuildNameStub({ value: 'New Name' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [] }),
      });

      await expect(guildUpdateBroker({ guildId, name: newName })).rejects.toThrow(
        /Guild not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });

    it('ERROR: {path already used by another guild} => throws duplicate path error', async () => {
      const proxy = guildUpdateBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const guild1 = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First Guild',
        path: '/home/user/taken-path',
      });
      const guild2 = GuildStub({
        id: guildId,
        name: 'Second Guild',
        path: '/home/user/second',
      });
      const duplicatePath = GuildPathStub({ value: '/home/user/taken-path' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild1, guild2] }),
      });

      await expect(guildUpdateBroker({ guildId, path: duplicatePath })).rejects.toThrow(
        /A guild with path \/home\/user\/taken-path already exists/u,
      );
    });

    it('EDGE: {path same as own current path} => succeeds without duplicate error', async () => {
      const proxy = guildUpdateBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({
        id: guildId,
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const samePath = GuildPathStub({ value: '/home/user/my-app' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await guildUpdateBroker({ guildId, path: samePath });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        urlSlug: 'my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
        chatSessions: [],
      });
    });
  });
});
