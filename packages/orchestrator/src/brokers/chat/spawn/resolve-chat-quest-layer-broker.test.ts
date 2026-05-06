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
