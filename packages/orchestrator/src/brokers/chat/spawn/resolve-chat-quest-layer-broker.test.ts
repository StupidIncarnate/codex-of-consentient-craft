import {
  GuildIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { workItemRoleStatics } from '@dungeonmaster/shared/statics';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

// The MAIN chat composer resumes the thread it owns — spec/design/bug intake — never the
// post-quest follow-up thread. That subset is workItemRoleStatics.chat minus its one
// postQuestChat member (tavernkeeper), derived here so a fourth chat role added to the tuple
// joins this matrix automatically instead of silently escaping it.
const MAIN_COMPOSER_CHAT_ROLES = workItemRoleStatics.chat.filter(
  (role) => !workItemRoleStatics.postQuestChat.some((postQuestRole) => postQuestRole === role),
);
// Of those, glyphsmith resolves through its own dedicated design-phase branch (lines 51-68 of
// the broker) that never reads `sessionId` at all — it cannot take the "no sessionId reaches
// this call" path chaoswhisperer/bughunt do, so it gets its own dedicated case instead of
// joining this subset.
const MAIN_COMPOSER_INTAKE_RESUME_ROLES = MAIN_COMPOSER_CHAT_ROLES.filter(
  (role) => role !== 'glyphsmith',
);

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

  // The create-surface chat route pre-mints a questId (to persist pasted images under it before
  // any quest exists) and hands it in via `mintedQuestId` — a channel deliberately separate from
  // `questId`, which already means something else (a resume hint) when `sessionId` is absent. See
  // main-composer-ignores-tavernkeeper-session below for the case `mintedQuestId` must NOT touch.
  describe('mintedQuestId', () => {
    it('VALID: {role: chaoswhisperer + mintedQuestId, no sessionId, no questId} => creates the quest under the SUPPLIED id rather than a freshly generated one', async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const mintedQuestId = QuestIdStub({ value: '99999999-9999-4999-8999-999999999999' });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
        guildId: GuildIdStub(),
        mintedQuestId,
        message: 'first [Pasted Image 1]',
      });

      expect(result).toStrictEqual({
        questId: mintedQuestId,
        workItemId: expect.stringMatching(UUID_PATTERN),
        createdQuest: true,
      });
      expect(proxy.getLastCreatedQuestId()).toBe(mintedQuestId);
    });
  });

  // The main quest-chat HTTP route has already loaded this exact quest off disk before ever
  // calling in here, so a missing sessionId must never fall through to minting a fresh quest —
  // that was the shape of the bug this channel exists to close (a chaoswhisperer item sitting at
  // a terminal status with no sessionId ever captured, during the async window before
  // chat-spawn-broker's onSessionId callback writes one back).
  describe('existingQuestId', () => {
    it('VALID: {existingQuestId names a real quest, matching role work item, no sessionId} => resolves that work item on the SAME quest, never creates one', async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'existing-quest-no-session' });
      const chaosItem = WorkItemStub({ role: 'chaoswhisperer', status: 'complete' });
      proxy.setupQuestFound({
        quest: QuestStub({ id: questId, folder: questId, workItems: [chaosItem] }),
      });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
        guildId: GuildIdStub(),
        existingQuestId: questId,
        message: 'one more thing',
      });

      expect(result).toStrictEqual({
        questId,
        workItemId: chaosItem.id,
        createdQuest: false,
      });
      expect(proxy.wasNewQuestCreated()).toBe(false);
    });

    it('VALID: {existingQuestId set, plus a DIFFERENT questId+sessionId that would resolve elsewhere} => existingQuestId wins, ignoring the ambiguous questId/sessionId pair', async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const existingQuestId = QuestIdStub({ value: 'existing-quest-priority' });
      const chaosItem = WorkItemStub({ role: 'chaoswhisperer', status: 'complete' });
      proxy.setupQuestFound({
        quest: QuestStub({ id: existingQuestId, folder: existingQuestId, workItems: [chaosItem] }),
      });

      const result = await resolveChatQuestLayerBroker({
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
        guildId: GuildIdStub(),
        existingQuestId,
        questId: QuestIdStub({ value: 'unrelated-resume-hint-quest' }),
        sessionId: SessionIdStub({ value: 'unrelated-session' }),
        message: 'one more thing',
      });

      expect(result).toStrictEqual({
        questId: existingQuestId,
        workItemId: chaosItem.id,
        createdQuest: false,
      });
    });

    it("ERROR: {existingQuestId + quest not found} => throws 'Quest not found: <id>'", async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const existingQuestId = QuestIdStub({ value: 'missing-existing-quest' });
      proxy.setupQuestNotFound();

      await expect(
        resolveChatQuestLayerBroker({
          role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
          guildId: GuildIdStub(),
          existingQuestId,
          message: 'one more thing',
        }),
      ).rejects.toThrow(/^Quest not found: missing-existing-quest$/u);
    });

    it('ERROR: {existingQuestId + quest has no matching role work item} => throws naming the quest and role', async () => {
      const proxy = resolveChatQuestLayerBrokerProxy();
      const existingQuestId = QuestIdStub({ value: 'existing-quest-no-role-item' });
      const otherItem = WorkItemStub({ role: 'codeweaver' });
      proxy.setupQuestFound({
        quest: QuestStub({
          id: existingQuestId,
          folder: existingQuestId,
          workItems: [otherItem],
        }),
      });

      await expect(
        resolveChatQuestLayerBroker({
          role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
          guildId: GuildIdStub(),
          existingQuestId,
          message: 'one more thing',
        }),
      ).rejects.toThrow(/^Quest existing-quest-no-role-item has no chaoswhisperer work item$/u);
    });
  });

  // #main-composer-ignores-tavernkeeper-session: a message sent through the quest's MAIN chat
  // composer (POST /api/quests/:questId/chat) resumes the chaoswhisperer / glyphsmith / bughunt
  // session, never the tavernkeeper session — including when the tavernkeeper work item is
  // listed FIRST in quest.workItems; when the tavernkeeper item is the only chat item carrying
  // a sessionId, that route starts a fresh chat with no sessionId rather than joining the
  // follow-up conversation.
  //
  // Regression coverage for a previous session's loosened line 99
  // (`wi.role === role || wi.role === 'tavernkeeper'`): every fixture above seeds exactly one
  // work item, so "the item with the matching role" and "the first item" were the same object
  // and `.find()` could never tell them apart. These fixtures seed at least two, tavernkeeper
  // always first.
  describe('main-composer-ignores-tavernkeeper-session', () => {
    const HOSTILE_LONG_SESSION_TOKEN = `sess-${'z'.repeat(400)}`;
    const MARKUP_LIKE_TAVERNKEEPER_SESSION_ID = '<img src=x onerror=alert(1)>-tavern-session';

    describe('case 1: tavernkeeper listed first, alongside a real chat item with a distinct sessionId', () => {
      it.each(MAIN_COMPOSER_CHAT_ROLES)(
        "VALID: {workItems: [tavernkeeper first, %s second], distinct sessionIds} => resolves that role's own work item, never the tavernkeeper's",
        async (role) => {
          const proxy = resolveChatQuestLayerBrokerProxy();
          const roleIndex = MAIN_COMPOSER_CHAT_ROLES.indexOf(role);
          const questId = QuestIdStub({ value: `main-composer-case1-${role}` });
          const tavernkeeperItem = WorkItemStub({
            id: `aaaaaaa${String(roleIndex)}-1111-4222-9333-444444444444`,
            role: 'tavernkeeper',
            status: 'complete',
            sessionId: SessionIdStub({ value: MARKUP_LIKE_TAVERNKEEPER_SESSION_ID }),
          });
          const chatItem = WorkItemStub({
            id: `bbbbbbb${String(roleIndex)}-1111-4222-9333-444444444444`,
            role: WorkItemRoleStub({ value: role }),
            status: 'in_progress',
            sessionId: SessionIdStub({ value: HOSTILE_LONG_SESSION_TOKEN }),
          });
          proxy.setupQuestFound({
            quest: QuestStub({
              id: questId,
              folder: questId,
              // Harmless for chaoswhisperer/bughunt (their resolution branch never reads
              // status); satisfies glyphsmith's design-phase gate so all three rows share one
              // fixture shape.
              status: 'explore_design',
              workItems: [tavernkeeperItem, chatItem], // tavernkeeper FIRST
            }),
          });

          const result = await resolveChatQuestLayerBroker({
            role: WorkItemRoleStub({ value: role }),
            guildId: GuildIdStub(),
            questId,
            sessionId: SessionIdStub({ value: HOSTILE_LONG_SESSION_TOKEN }),
            message: 'still building on this',
          });

          expect(result).toStrictEqual({
            questId,
            workItemId: chatItem.id,
            createdQuest: false,
          });
        },
      );
    });

    describe('case 2: tavernkeeper is the only chat item carrying a sessionId', () => {
      // chaoswhisperer + bughunt share the generic sessionId+questId resolution branch (lines
      // 92-104 of the broker). When quest-chat-responder's own selector
      // (isChatWorkItemRoleGuard && !isPostQuestChatWorkItemRoleGuard) finds no non-tavernkeeper
      // chat item carrying a sessionId, no sessionId reaches this call at all — so the branch's
      // `if (sessionId && questId)` guard is false and the broker mints a fresh quest rather
      // than resuming anything. glyphsmith never takes this path (see its own case below).
      it.each(MAIN_COMPOSER_INTAKE_RESUME_ROLES)(
        'VALID: {only the tavernkeeper item carries a sessionId, %s call omits sessionId} => mints a fresh quest instead of joining the tavernkeeper conversation',
        async (role) => {
          const proxy = resolveChatQuestLayerBrokerProxy();
          const roleIndex = MAIN_COMPOSER_INTAKE_RESUME_ROLES.indexOf(role);
          const questId = QuestIdStub({ value: `main-composer-case2-${role}` });
          const tavernkeeperItem = WorkItemStub({
            id: `ccccccc${String(roleIndex)}-1111-4222-9333-444444444444`,
            role: 'tavernkeeper',
            status: 'complete',
            sessionId: SessionIdStub({ value: MARKUP_LIKE_TAVERNKEEPER_SESSION_ID }),
          });
          const chatItemNoSession = WorkItemStub({
            id: `ddddddd${String(roleIndex)}-1111-4222-9333-444444444444`,
            role: WorkItemRoleStub({ value: role }),
            status: 'pending',
          });
          proxy.setupQuestFound({
            quest: QuestStub({
              id: questId,
              folder: questId,
              status: 'in_progress',
              workItems: [tavernkeeperItem, chatItemNoSession],
            }),
          });

          const result = await resolveChatQuestLayerBroker({
            role: WorkItemRoleStub({ value: role }),
            guildId: GuildIdStub(),
            questId,
            message: 'anyone there?',
          });

          expect(result).toStrictEqual({
            questId: expect.stringMatching(UUID_PATTERN),
            workItemId: expect.stringMatching(UUID_PATTERN),
            createdQuest: true,
          });
        },
      );

      it("VALID: {glyphsmith path, only tavernkeeper carries a sessionId, glyphsmith item has none yet} => resolves the glyphsmith work item, never the tavernkeeper's", async () => {
        const proxy = resolveChatQuestLayerBrokerProxy();
        const questId = QuestIdStub({ value: 'main-composer-case2-glyphsmith' });
        const tavernkeeperItem = WorkItemStub({
          id: 'eeeeeeee-1111-4222-9333-444444444444',
          role: 'tavernkeeper',
          status: 'complete',
          sessionId: SessionIdStub({ value: MARKUP_LIKE_TAVERNKEEPER_SESSION_ID }),
        });
        const glyphsmithItemNoSession = WorkItemStub({
          id: 'ffffffff-1111-4222-9333-444444444444',
          role: 'glyphsmith',
          status: 'pending',
        });
        proxy.setupQuestFound({
          quest: QuestStub({
            id: questId,
            folder: questId,
            status: 'explore_design',
            // tavernkeeper carries the ONLY sessionId on this quest.
            workItems: [tavernkeeperItem, glyphsmithItemNoSession],
          }),
        });

        const result = await resolveChatQuestLayerBroker({
          role: WorkItemRoleStub({ value: 'glyphsmith' }),
          guildId: GuildIdStub(),
          questId,
          message: 'anyone there?',
        });

        expect(result).toStrictEqual({
          questId,
          workItemId: glyphsmithItemNoSession.id,
          createdQuest: false,
        });
      });
    });
  });
});
