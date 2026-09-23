import { questWriteRouteBroker } from './quest-write-route-broker';
import { questWriteRouteBrokerProxy } from './quest-write-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questWriteRouteBroker', () => {
  describe('a minimal quest', () => {
    it('VALID: {title, userRequest, status, guildId} => returns a full quest record with a minted id, folder and createdAt', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const questFilePath = `/tmp/dm-home/guilds/${GUILD_ID}/quests/${proxy.mintedQuestId}/quest.json`;
      proxy.succeeds({ questFilePath, outboxPath: '/tmp/dm-home/event-outbox.jsonl' });

      const result = await questWriteRouteBroker({
        target,
        fields: {
          title: 'Add Auth',
          userRequest: 'seeded quest 1',
          status: 'created',
          guildId: GUILD_ID,
        },
      });

      expect(result).toStrictEqual({
        id: proxy.mintedQuestId,
        folder: proxy.mintedQuestId,
        title: 'Add Auth',
        status: 'created',
        questType: 'feature',
        createdAt: proxy.mintedCreatedAt,
        designDecisions: [],
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [],
        comments: [],
        userRequest: 'seeded quest 1',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        sessions: [],
        planningNotes: { blightLedger: [], questNotes: [], operationPlans: [] },
      });
    });

    it('VALID: {title, userRequest, status, guildId} => every path it touches is under the target home', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const questFolder = `/tmp/dm-home/guilds/${GUILD_ID}/quests/${proxy.mintedQuestId}`;
      proxy.succeeds({
        questFilePath: `${questFolder}/quest.json`,
        outboxPath: '/tmp/dm-home/event-outbox.jsonl',
      });

      await questWriteRouteBroker({
        target,
        fields: {
          title: 'Add Auth',
          userRequest: 'seeded quest 1',
          status: 'created',
          guildId: GUILD_ID,
        },
      });

      expect(proxy.pathsTouched()).toStrictEqual([
        questFolder,
        `${questFolder}/quest.json.tmp`,
        `${questFolder}/quest.json`,
        '/tmp/dm-home/event-outbox.jsonl',
      ]);
    });
  });

  describe('a folder whose ".." segments stay inside the target', () => {
    it('VALID: {folder: "x/../good-folder"} => writes the quest file at the resolved folder', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const questFolder = `/tmp/dm-home/guilds/${GUILD_ID}/quests/good-folder`;
      proxy.succeeds({
        questFilePath: `${questFolder}/quest.json`,
        outboxPath: '/tmp/dm-home/event-outbox.jsonl',
      });

      const result = await questWriteRouteBroker({
        target,
        fields: {
          title: 'Add Auth',
          userRequest: 'seeded quest 1',
          status: 'created',
          guildId: GUILD_ID,
          folder: 'x/../good-folder',
        },
      });

      expect(result.folder).toBe('x/../good-folder');
      expect(proxy.pathsTouched()).toStrictEqual([
        questFolder,
        `${questFolder}/quest.json.tmp`,
        `${questFolder}/quest.json`,
        '/tmp/dm-home/event-outbox.jsonl',
      ]);
    });
  });

  describe('a folder that escapes the target', () => {
    it('INVALID: {folder: "../../../../escape-target"} => throws naming the resolved path and the target home', async () => {
      questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await expect(
        questWriteRouteBroker({
          target,
          fields: {
            title: 'Add Auth',
            userRequest: 'seeded quest 1',
            status: 'created',
            guildId: GUILD_ID,
            folder: '../../../../escape-target',
          },
        }),
      ).rejects.toThrow(
        /^questWriteRouteBroker: folder "\.\.\/\.\.\/\.\.\/\.\.\/escape-target" resolves to "\/tmp\/escape-target", outside the target home "\/tmp\/dm-home"$/u,
      );
    });

    it('INVALID: {folder: "../../../../escape-target"} => touches no path at all', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await expect(
        questWriteRouteBroker({
          target,
          fields: {
            title: 'Add Auth',
            userRequest: 'seeded quest 1',
            status: 'created',
            guildId: GUILD_ID,
            folder: '../../../../escape-target',
          },
        }),
      ).rejects.toThrow(/outside the target home/u);

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });

    // A SIBLING whose name merely begins with the target's own. `/tmp/dm-home-evil` passes any
    // containment test written as `startsWith(targetRoot)`, and lands the quest file next to the
    // target rather than in it — the separator is the whole difference.
    it('INVALID: {folder: "/tmp/dm-home-evil"} => throws naming the sibling path, and touches no path at all', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await expect(
        questWriteRouteBroker({
          target,
          fields: {
            title: 'Add Auth',
            userRequest: 'seeded quest 1',
            status: 'created',
            guildId: GUILD_ID,
            folder: '/tmp/dm-home-evil',
          },
        }),
      ).rejects.toThrow(
        /^questWriteRouteBroker: folder "\/tmp\/dm-home-evil" resolves to "\/tmp\/dm-home-evil", outside the target home "\/tmp\/dm-home"$/u,
      );

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });

    it('INVALID: {folder: "../../../../dm-home-evil"} => throws naming the sibling path, and touches no path at all', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await expect(
        questWriteRouteBroker({
          target,
          fields: {
            title: 'Add Auth',
            userRequest: 'seeded quest 1',
            status: 'created',
            guildId: GUILD_ID,
            folder: '../../../../dm-home-evil',
          },
        }),
      ).rejects.toThrow(
        /^questWriteRouteBroker: folder "\.\.\/\.\.\/\.\.\/\.\.\/dm-home-evil" resolves to "\/tmp\/dm-home-evil", outside the target home "\/tmp\/dm-home"$/u,
      );

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });

    it('INVALID: {folder: "/tmp/absolute-escape"} => throws, and touches no path at all', async () => {
      const proxy = questWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      await expect(
        questWriteRouteBroker({
          target,
          fields: {
            title: 'Add Auth',
            userRequest: 'seeded quest 1',
            status: 'created',
            guildId: GUILD_ID,
            folder: '/tmp/absolute-escape',
          },
        }),
      ).rejects.toThrow(
        /^questWriteRouteBroker: folder "\/tmp\/absolute-escape" resolves to "\/tmp\/absolute-escape", outside the target home "\/tmp\/dm-home"$/u,
      );

      expect(proxy.pathsTouched()).toStrictEqual([]);
    });
  });
});
