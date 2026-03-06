import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { GuildIdStub, GuildNameStub, GuildPathStub } from '@dungeonmaster/shared/contracts';

import { GuildFlow } from './guild-flow';

const setupGuildHome = (guildPath: string): void => {
  const dungeonmasterDir = join(guildPath, '.dungeonmaster');
  mkdirSync(dungeonmasterDir, { recursive: true });
  writeFileSync(join(dungeonmasterDir, 'config.json'), JSON.stringify({ guilds: [] }));
};

describe('GuildFlow', () => {
  describe('delegation to responders', () => {
    it('VALID: {name, path} => add delegates to GuildAddResponder and returns new guild', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-add' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const name = GuildNameStub({ value: 'My Test App' });
      const path = GuildPathStub({ value: '/home/user/my-test-app' });

      const result = await GuildFlow.add({ name, path });

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({
        id: result.id,
        name: 'My Test App',
        path: '/home/user/my-test-app',
        urlSlug: 'my-test-app',
        createdAt: result.createdAt,
      });
    });

    it('VALID: {guildId: existing} => get delegates to GuildGetResponder and returns guild', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-get' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const name = GuildNameStub({ value: 'Findable Guild' });
      const path = GuildPathStub({ value: '/home/user/findable-guild' });

      const added = await GuildFlow.add({ name, path });
      const guildId = GuildIdStub({ value: added.id });

      const result = await GuildFlow.get({ guildId });

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({
        id: added.id,
        name: 'Findable Guild',
        path: '/home/user/findable-guild',
        urlSlug: 'findable-guild',
        createdAt: added.createdAt,
      });
    });

    it('VALID: {no guilds} => list delegates to GuildListResponder and returns empty array', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-list-empty' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const result = await GuildFlow.list();

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual([]);
    });

    it('VALID: {one guild added} => list delegates to GuildListResponder and returns that guild', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-list-one' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const name = GuildNameStub({ value: 'Listed Guild' });
      const path = GuildPathStub({ value: '/home/user/listed-guild' });

      const added = await GuildFlow.add({ name, path });

      const result = await GuildFlow.list();

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual([
        {
          id: added.id,
          name: 'Listed Guild',
          path: '/home/user/listed-guild',
          urlSlug: 'listed-guild',
          createdAt: added.createdAt,
          questCount: 0,
          valid: false,
        },
      ]);
    });

    it('VALID: {multiple guilds added} => list returns all guilds in insertion order', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-list-many' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const first = await GuildFlow.add({
        name: GuildNameStub({ value: 'First Guild' }),
        path: GuildPathStub({ value: '/home/user/first-guild' }),
      });
      const second = await GuildFlow.add({
        name: GuildNameStub({ value: 'Second Guild' }),
        path: GuildPathStub({ value: '/home/user/second-guild' }),
      });

      const result = await GuildFlow.list();

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual([
        {
          id: first.id,
          name: 'First Guild',
          path: '/home/user/first-guild',
          urlSlug: 'first-guild',
          createdAt: first.createdAt,
          questCount: 0,
          valid: false,
        },
        {
          id: second.id,
          name: 'Second Guild',
          path: '/home/user/second-guild',
          urlSlug: 'second-guild',
          createdAt: second.createdAt,
          questCount: 0,
          valid: false,
        },
      ]);
    });

    it('VALID: {guildId: existing, new name} => update delegates to GuildUpdateResponder and returns updated guild', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-update-name' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const added = await GuildFlow.add({
        name: GuildNameStub({ value: 'Original Name' }),
        path: GuildPathStub({ value: '/home/user/original-path' }),
      });
      const guildId = GuildIdStub({ value: added.id });
      const newName = GuildNameStub({ value: 'Updated Name' });

      const result = await GuildFlow.update({ guildId, name: newName });

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({
        id: added.id,
        name: 'Updated Name',
        path: '/home/user/original-path',
        urlSlug: 'original-name',
        createdAt: added.createdAt,
      });
    });

    it('VALID: {guildId: existing, new path} => update delegates to GuildUpdateResponder and returns updated guild', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-update-path' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const added = await GuildFlow.add({
        name: GuildNameStub({ value: 'Guild With Path' }),
        path: GuildPathStub({ value: '/home/user/old-path' }),
      });
      const guildId = GuildIdStub({ value: added.id });
      const newPath = GuildPathStub({ value: '/home/user/new-path' });

      const result = await GuildFlow.update({ guildId, path: newPath });

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({
        id: added.id,
        name: 'Guild With Path',
        path: '/home/user/new-path',
        urlSlug: 'guild-with-path',
        createdAt: added.createdAt,
      });
    });

    it('VALID: {guildId: existing} => remove delegates to GuildRemoveResponder and guild is gone from list', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-remove' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const added = await GuildFlow.add({
        name: GuildNameStub({ value: 'To Be Removed' }),
        path: GuildPathStub({ value: '/home/user/to-be-removed' }),
      });
      const guildId = GuildIdStub({ value: added.id });

      await GuildFlow.remove({ guildId });

      const remaining = await GuildFlow.list();

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(remaining).toStrictEqual([]);
    });

    it('VALID: {add two, remove one} => full lifecycle delegates through flow and remaining guild is correct', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-lifecycle' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const first = await GuildFlow.add({
        name: GuildNameStub({ value: 'First' }),
        path: GuildPathStub({ value: '/home/user/first' }),
      });
      const second = await GuildFlow.add({
        name: GuildNameStub({ value: 'Second' }),
        path: GuildPathStub({ value: '/home/user/second' }),
      });

      await GuildFlow.remove({ guildId: GuildIdStub({ value: first.id }) });

      const listed = await GuildFlow.list();

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(listed).toStrictEqual([
        {
          id: second.id,
          name: 'Second',
          path: '/home/user/second',
          urlSlug: 'second',
          createdAt: second.createdAt,
          questCount: 0,
          valid: false,
        },
      ]);
    });

    it('ERROR: {guildId: nonexistent} => get throws guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-get-error' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const errorMessage = await GuildFlow.get({ guildId }).catch(
        (thrown: unknown) => (thrown as Error).message,
      );

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(errorMessage).toMatch(/Guild not found/u);
    });

    it('ERROR: {guildId: nonexistent} => remove throws guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-remove-error' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const errorMessage = await GuildFlow.remove({ guildId }).catch(
        (thrown: unknown) => (thrown as Error).message,
      );

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(errorMessage).toMatch(/Guild not found/u);
    });

    it('ERROR: {guildId: nonexistent} => update throws guild not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-update-error' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const errorMessage = await GuildFlow.update({ guildId }).catch(
        (thrown: unknown) => (thrown as Error).message,
      );

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(errorMessage).toMatch(/Guild not found/u);
    });

    it('ERROR: {duplicate path} => add throws duplicate path error', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'guild-flow-duplicate' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      setupGuildHome(testbed.guildPath);

      const path = GuildPathStub({ value: '/home/user/duplicate-path' });

      await GuildFlow.add({
        name: GuildNameStub({ value: 'First Guild' }),
        path,
      });

      const errorMessage = await GuildFlow.add({
        name: GuildNameStub({ value: 'Second Guild' }),
        path,
      }).catch((thrown: unknown) => (thrown as Error).message);

      testbed.cleanup();
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(errorMessage).toMatch(
        /A guild with path \/home\/user\/duplicate-path already exists/u,
      );
    });
  });
});
