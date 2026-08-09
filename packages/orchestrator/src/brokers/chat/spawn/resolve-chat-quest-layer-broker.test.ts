import {
  GuildIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

import { resolveChatQuestLayerBroker } from './resolve-chat-quest-layer-broker';
import { resolveChatQuestLayerBrokerProxy } from './resolve-chat-quest-layer-broker.proxy';

describe('resolveChatQuestLayerBroker', () => {
  describe('chaoswhisperer-resume path', () => {
    it('VALID: {role: chaoswhisperer + sessionId + questId} => returns chaoswhisperer work item id', async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'resume-quest' });
      const chaosItem = WorkItemStub({ role: 'chaoswhisperer' });
      proxy.setupQuestFound({
        quest: QuestStub({ id: questId, folder: questId, workItems: [chaosItem] }),
      });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
        guildId: GuildIdStub(),
        questId,
        sessionId: SessionIdStub({ value: 'sess-resume' }),
        message: 'continue',
      });

      expect(result).toStrictEqual({
        questId,
        workItemId: chaosItem.id,
        createdQuest: false,
      });
    });
  });

  describe('glyphsmith path', () => {
    it('VALID: {role: glyphsmith + design-phase quest} => returns glyph work item id', async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'design-quest' });
      const glyphItem = WorkItemStub({ role: 'glyphsmith' });
      proxy.setupQuestFound({
        quest: QuestStub({
          id: questId,
          folder: questId,
          status: 'explore_design',
          workItems: [glyphItem],
        }),
      });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'glyphsmith' }),
        guildId: GuildIdStub(),
        questId,
        message: 'design',
      });

      expect(result).toStrictEqual({
        questId,
        workItemId: glyphItem.id,
        createdQuest: false,
      });
    });
  });

  describe('tavernkeeper role', () => {
    it("VALID: {tavernkeeper + questId + existing complete tavernkeeper item} => returns that item's id", async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'finished-quest' });
      const tavernkeeperItem = WorkItemStub({ role: 'tavernkeeper', status: 'complete' });
      proxy.setupQuestFound({
        quest: QuestStub({
          id: questId,
          folder: questId,
          status: 'complete',
          workItems: [tavernkeeperItem],
        }),
      });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'tavernkeeper' }),
        guildId: GuildIdStub(),
        questId,
        message: 'one more thing',
      });

      expect(result).toStrictEqual({
        questId,
        workItemId: tavernkeeperItem.id,
        createdQuest: false,
      });
      // The load-bearing proof: a first follow-up message (no sessionId yet) must resolve the
      // existing quest's tavernkeeper item, not fall through to questUserAddBroker and mint a
      // second quest.
      expect(proxy.wasNewQuestCreated()).toBe(false);
    });

    it("VALID: {tavernkeeper + questId + tavernkeeper item left in_progress} => returns that item's id", async () => {
      // Crash-recovery case: a tavernkeeper session killed by a server crash (or stopped for a
      // merge) leaves its work item sitting in_progress forever. The lookup matches on role
      // alone, so the next follow-up message still resolves to this same item.
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'crashed-quest' });
      const tavernkeeperItem = WorkItemStub({ role: 'tavernkeeper', status: 'in_progress' });
      proxy.setupQuestFound({
        quest: QuestStub({
          id: questId,
          folder: questId,
          status: 'blocked',
          workItems: [tavernkeeperItem],
        }),
      });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'tavernkeeper' }),
        guildId: GuildIdStub(),
        questId,
        message: 'still there?',
      });

      expect(result).toStrictEqual({
        questId,
        workItemId: tavernkeeperItem.id,
        createdQuest: false,
      });
    });

    it("VALID: {tavernkeeper + questId + sessionId + existing item} => returns that item's id", async () => {
      // Proves the tavernkeeper branch runs ahead of the intake-resume branch below it — a
      // second-and-later follow-up message carries a sessionId too, and must not fall into the
      // generic sessionId+questId path.
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'resumed-tavern-quest' });
      const tavernkeeperItem = WorkItemStub({
        role: 'tavernkeeper',
        status: 'complete',
        sessionId: SessionIdStub({ value: 'sess-tavern' }),
      });
      proxy.setupQuestFound({
        quest: QuestStub({
          id: questId,
          folder: questId,
          status: 'complete',
          workItems: [tavernkeeperItem],
        }),
      });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'tavernkeeper' }),
        guildId: GuildIdStub(),
        questId,
        sessionId: SessionIdStub({ value: 'sess-tavern' }),
        message: 'continuing',
      });

      expect(result).toStrictEqual({
        questId,
        workItemId: tavernkeeperItem.id,
        createdQuest: false,
      });
    });

    it("ERROR: {tavernkeeper + no questId} => throws 'questId is required for tavernkeeper role'", async () => {
      resolveChatQuestLayerBrokerProxy();

      await expect(
        resolveChatQuestLayerBroker({
          role: WorkItemRoleStub({ value: 'tavernkeeper' }),
          guildId: GuildIdStub(),
          message: 'one more thing',
        }),
      ).rejects.toThrow(/^questId is required for tavernkeeper role$/u);
    });

    it('ERROR: {tavernkeeper + questId + quest has no tavernkeeper item} => throws naming the quest', async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'no-tavernkeeper-quest' });
      const codeweaverItem = WorkItemStub({ role: 'codeweaver' });
      proxy.setupQuestFound({
        quest: QuestStub({
          id: questId,
          folder: questId,
          status: 'complete',
          workItems: [codeweaverItem],
        }),
      });

      await expect(
        resolveChatQuestLayerBroker({
          role: WorkItemRoleStub({ value: 'tavernkeeper' }),
          guildId: GuildIdStub(),
          questId,
          message: 'one more thing',
        }),
      ).rejects.toThrow(/^Quest no-tavernkeeper-quest has no tavernkeeper work item$/u);
    });

    it("ERROR: {tavernkeeper + questId + quest not found} => throws 'Quest not found: <id>'", async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'missing-tavernkeeper-quest' });
      proxy.setupQuestNotFound();

      await expect(
        resolveChatQuestLayerBroker({
          role: WorkItemRoleStub({ value: 'tavernkeeper' }),
          guildId: GuildIdStub(),
          questId,
          message: 'one more thing',
        }),
      ).rejects.toThrow(/^Quest not found: missing-tavernkeeper-quest$/u);
    });
  });

  describe('error paths', () => {
    it('ERROR: {role: glyphsmith without questId} => throws', async () => {
      resolveChatQuestLayerBrokerProxy();

      await expect(
        resolveChatQuestLayerBroker({
          role: WorkItemRoleStub({ value: 'glyphsmith' }),
          guildId: GuildIdStub(),
          message: 'design',
        }),
      ).rejects.toThrow(/questId is required for glyphsmith role/u);
    });

    it('VALID: {role: chaoswhisperer + sessionId without questId} => falls through to new quest creation', async () => {
      // When sessionId is provided but questId is unknown (no linked quest found by the
      // responder), resolveChatQuestLayerBroker falls through to questUserAddBroker so the
      // user can continue the Claude CLI session in a new quest context.
      resolveChatQuestLayerBrokerProxy();

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
        guildId: GuildIdStub(),
        sessionId: SessionIdStub({ value: 'sess-no-quest' }),
        message: 'continue',
      });

      expect(result).toStrictEqual({
        questId: expect.stringMatching(UUID_PATTERN),
        workItemId: expect.stringMatching(UUID_PATTERN),
        createdQuest: true,
      });
    });
  });
});
