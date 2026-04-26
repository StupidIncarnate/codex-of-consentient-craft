import { guildPathWalkUpLayerBroker } from './guild-path-walk-up-layer-broker';
import { guildPathWalkUpLayerBrokerProxy } from './guild-path-walk-up-layer-broker.proxy';
import { GuildRootNotFoundError } from '../../../errors/guild-root-not-found/guild-root-not-found-error';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('guildPathWalkUpLayerBroker', () => {
  describe('guild root found', () => {
    it('VALID: {startPath: "/dm/guilds/foo"} => finds guild.json in startPath directory', async () => {
      const proxy = guildPathWalkUpLayerBrokerProxy();
      const startPath = FilePathStub({ value: '/dm/guilds/foo' });

      proxy.setupGuildFoundAtStart({ startPath: '/dm/guilds/foo' });

      const result = await guildPathWalkUpLayerBroker({ startPath });

      expect(result).toBe('/dm/guilds/foo');
    });

    it('VALID: {startPath: "/dm/guilds/foo/quests/q1"} => finds guild.json in parent directory', async () => {
      const proxy = guildPathWalkUpLayerBrokerProxy();
      const startPath = FilePathStub({ value: '/dm/guilds/foo/quests/q1' });

      proxy.setupGuildFoundInParent({
        startPath: '/dm/guilds/foo/quests/q1',
        guildPath: '/dm/guilds/foo',
      });

      const result = await guildPathWalkUpLayerBroker({ startPath });

      expect(result).toBe('/dm/guilds/foo');
    });
  });

  describe('guild root not found', () => {
    it('ERROR: {startPath: "/no-guild"} => throws GuildRootNotFoundError', async () => {
      const proxy = guildPathWalkUpLayerBrokerProxy();
      const startPath = FilePathStub({ value: '/no-guild' });

      proxy.setupGuildNotFound({ startPath: '/no-guild' });

      await expect(guildPathWalkUpLayerBroker({ startPath })).rejects.toThrow(
        GuildRootNotFoundError,
      );
    });
  });
});
