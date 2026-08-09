/**
 * PURPOSE: Tests for RecoverGuildLayerResponder verifying quest recovery filtering and process registration
 *
 * USAGE:
 * npm run ward -- --only test -- recover-guild-layer-responder.test.ts
 */

import {
  AbsoluteFilePathStub,
  GuildIdStub,
  GuildListItemStub,
  GuildPathStub,
  QuestBranchNameStub,
  QuestIdStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { RecoverGuildLayerResponder } from './recover-guild-layer-responder';
import { RecoverGuildLayerResponderProxy } from './recover-guild-layer-responder.proxy';

describe('RecoverGuildLayerResponder', () => {
  describe('invalid guild', () => {
    it('VALID: {guildItem.valid: false} => returns empty array', async () => {
      RecoverGuildLayerResponderProxy();
      const guildItem = GuildListItemStub({ valid: false });

      const result = await RecoverGuildLayerResponder({ guildItem });

      expect(result).toStrictEqual([]);
    });
  });

  describe('recoverable quest statuses', () => {
    it('VALID: {quest status: created} => registers process for recovery', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-created' });
      const quest = QuestStub({ id: questId, folder: '001-created-quest', status: 'created' });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {quest status: pending} => registers process for recovery', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-pending' });
      const quest = QuestStub({ id: questId, folder: '001-pending-quest', status: 'pending' });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {quest status: explore_flows} => registers process for recovery', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-explore-flows' });
      const quest = QuestStub({
        id: questId,
        folder: '001-explore-flows-quest',
        status: 'explore_flows',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {quest status: flows_approved} => registers process for recovery', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-flows-approved' });
      const quest = QuestStub({
        id: questId,
        folder: '001-flows-approved-quest',
        status: 'flows_approved',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {quest status: explore_observables} => registers process for recovery', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-explore-obs' });
      const quest = QuestStub({
        id: questId,
        folder: '001-explore-obs-quest',
        status: 'explore_observables',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {quest status: explore_design} => registers process for recovery', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-explore-design' });
      const quest = QuestStub({
        id: questId,
        folder: '001-explore-design-quest',
        status: 'explore_design',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {quest status: in_progress} => registers process for recovery', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-in-progress' });
      const quest = QuestStub({
        id: questId,
        folder: '001-in-progress-quest',
        status: 'in_progress',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });
  });

  describe('non-recoverable quest statuses', () => {
    it('VALID: {quest status: review_flows} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-review-flows' });
      const quest = QuestStub({
        id: questId,
        folder: '001-review-flows-quest',
        status: 'review_flows',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: review_observables} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-review-obs' });
      const quest = QuestStub({
        id: questId,
        folder: '001-review-obs-quest',
        status: 'review_observables',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: approved} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-approved' });
      const quest = QuestStub({
        id: questId,
        folder: '001-approved-quest',
        status: 'approved',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: review_design} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-review-design' });
      const quest = QuestStub({
        id: questId,
        folder: '001-review-design-quest',
        status: 'review_design',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: design_approved} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-design-approved' });
      const quest = QuestStub({
        id: questId,
        folder: '001-design-approved-quest',
        status: 'design_approved',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: complete} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-complete' });
      const quest = QuestStub({
        id: questId,
        folder: '001-complete-quest',
        status: 'complete',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: abandoned} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-abandoned' });
      const quest = QuestStub({
        id: questId,
        folder: '001-abandoned-quest',
        status: 'abandoned',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: blocked} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-blocked' });
      const quest = QuestStub({
        id: questId,
        folder: '001-blocked-quest',
        status: 'blocked',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });

    it('VALID: {quest status: paused} => does not register process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-paused' });
      const quest = QuestStub({
        id: questId,
        folder: '001-paused-quest',
        status: 'paused',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);
    });
  });

  describe('directory read errors', () => {
    it('VALID: {ENOENT error reading quest directory} => returns empty array without throwing', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      const enoentError = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });
      proxy.setupGuildDirectoryReadFailure({ error: enoentError });

      const result = await RecoverGuildLayerResponder({ guildItem });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: {non-ENOENT error reading quest directory} => throws the original error', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      const permissionError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });
      proxy.setupGuildDirectoryReadFailure({ error: permissionError });

      await expect(RecoverGuildLayerResponder({ guildItem })).rejects.toThrow(
        'EACCES: permission denied',
      );
    });
  });

  describe('existing process', () => {
    it('VALID: {recoverable quest with existing process} => does not register duplicate process', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-with-process' });
      const quest = QuestStub({
        id: questId,
        folder: '001-with-process-quest',
        status: 'in_progress',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithExistingProcess({
        guildId,
        guildPath,
        quests: [quest],
        existingProcessQuestId: questId,
      });

      await RecoverGuildLayerResponder({ guildItem });

      const processIds = proxy.getRegisteredProcessIds();

      // Only the pre-existing process should be registered, no new ones
      expect(processIds).toStrictEqual(['proc-existing-process']);
    });
  });

  describe('orphaned in_progress work items', () => {
    it('VALID: {quest with ward in_progress work item, no running process} => resets ward item to pending before launching loop', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-orphaned-ward' });
      const wardItemId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const wardWorkItem = WorkItemStub({
        id: wardItemId as never,
        role: 'ward' as never,
        status: 'in_progress',
        spawnerType: 'command' as never,
        startedAt: '2026-03-21T19:31:34.754Z',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-orphaned-ward-quest',
        status: 'in_progress',
        workItems: [wardWorkItem],
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuests = persisted.map(
        (content) => JSON.parse(content as never) as Record<PropertyKey, unknown>,
      );

      const resetQuest = persistedQuests.find((q) => q.id === questId);

      expect(resetQuest?.id).toBe(questId);

      const workItems = resetQuest!.workItems as Record<PropertyKey, unknown>[];
      const wardItem = workItems.find((wi) => wi.id === wardItemId);

      expect(wardItem?.status).toBe('pending');
    });
  });

  describe('orphaned agent work items with a retained session', () => {
    it('VALID: {in_progress codeweaver orphan WITH sessionId} => resets to pending KEEPING sessionId and gaining resume: true', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-orphaned-resume' });
      const orphanItemId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const sessionId = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';
      const orphanWorkItem = WorkItemStub({
        id: orphanItemId as never,
        role: 'codeweaver',
        status: 'in_progress',
        spawnerType: 'agent',
        sessionId: sessionId as never,
        startedAt: '2026-03-21T19:31:34.754Z',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-orphaned-resume-quest',
        status: 'in_progress',
        workItems: [orphanWorkItem],
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuests = persisted.map(
        (content) => JSON.parse(content as never) as Record<PropertyKey, unknown>,
      );

      const resetQuest = persistedQuests.find((q) => q.id === questId);

      expect(resetQuest?.id).toBe(questId);

      const workItems = resetQuest!.workItems as Record<PropertyKey, unknown>[];
      const orphanItem = workItems.find((wi) => wi.id === orphanItemId);

      expect({
        status: orphanItem?.status,
        resume: orphanItem?.resume,
        sessionId: orphanItem?.sessionId,
      }).toStrictEqual({
        status: 'pending',
        resume: true,
        sessionId,
      });

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {in_progress codeweaver orphan WITHOUT sessionId} => resets to pending without the resume marker', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-orphaned-fresh' });
      const orphanItemId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const orphanWorkItem = WorkItemStub({
        id: orphanItemId as never,
        role: 'codeweaver',
        status: 'in_progress',
        spawnerType: 'agent',
        startedAt: '2026-03-21T19:31:34.754Z',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-orphaned-fresh-quest',
        status: 'in_progress',
        workItems: [orphanWorkItem],
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuests = persisted.map(
        (content) => JSON.parse(content as never) as Record<PropertyKey, unknown>,
      );

      const resetQuest = persistedQuests.find((q) => q.id === questId);

      expect(resetQuest?.id).toBe(questId);

      const workItems = resetQuest!.workItems as Record<PropertyKey, unknown>[];
      const orphanItem = workItems.find((wi) => wi.id === orphanItemId);

      expect({
        status: orphanItem?.status,
        resume: orphanItem?.resume,
      }).toStrictEqual({
        status: 'pending',
        resume: undefined,
      });
    });

    it('VALID: {in_progress quest with only a pending item, no running process} => does not re-reset the pending item', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-pending-item' });
      const pendingItemId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const pendingWorkItem = WorkItemStub({
        id: pendingItemId as never,
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-pending-item-quest',
        status: 'in_progress',
        workItems: [pendingWorkItem],
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      await RecoverGuildLayerResponder({ guildItem });

      const persisted = proxy.getAllPersistedContents();

      // No reset should have been written — the pending item has no orphan to fix
      expect(persisted).toStrictEqual([]);

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });
  });

  describe('missing worktree', () => {
    it('ERROR: {recoverable quest whose recorded worktree is missing} => the quest is blocked with a reason naming the absolute path, no loop is launched for it, and it is absent from recoveredIds', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-missing-worktree' });
      const workItemId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const workItem = WorkItemStub({ id: workItemId as never, status: 'pending' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/missing-quest' });
      const quest = QuestStub({
        id: questId,
        folder: '001-missing-worktree-quest',
        status: 'in_progress',
        workItems: [workItem],
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });
      proxy.setupWorktreeMissing({ quest, worktreePath });

      const recoveredIds = await RecoverGuildLayerResponder({ guildItem });

      expect(recoveredIds).toStrictEqual([]);

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual([]);

      const persisted = proxy.getAllPersistedContents();
      const persistedQuests = persisted.map(
        (content) => JSON.parse(content as never) as Record<PropertyKey, unknown>,
      );
      const blockedQuest = persistedQuests.find((q) => q.id === questId);

      expect(blockedQuest?.status).toBe('blocked');

      const workItems = blockedQuest!.workItems as Record<PropertyKey, unknown>[];
      const blockedItem = workItems.find((wi) => wi.id === workItemId);

      expect(blockedItem?.errorMessage).toBe(`Worktree not found: ${worktreePath}`);
    });

    it('VALID: {two recoverable quests, one with a missing worktree} => the other quest is still recovered', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const missingQuestId = QuestIdStub({ value: 'quest-missing-worktree-2' });
      const okQuestId = QuestIdStub({ value: 'quest-ok-2' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/missing-quest-2' });
      const missingQuest = QuestStub({
        id: missingQuestId,
        folder: '001-missing-worktree-quest-2',
        status: 'in_progress',
      });
      const okQuest = QuestStub({
        id: okQuestId,
        folder: '002-ok-quest-2',
        status: 'in_progress',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [missingQuest, okQuest] });
      proxy.setupWorktreeMissing({ quest: missingQuest, worktreePath });

      const recoveredIds = await RecoverGuildLayerResponder({ guildItem });

      expect(recoveredIds).toStrictEqual([okQuestId]);
    });
  });

  describe('drifted worktree branch', () => {
    it('VALID: {worktree present but left on another branch} => the quest branch is re-checked-out before the loop launches', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-drifted-branch' });
      const branchName = QuestBranchNameStub({ value: 'quest/drifted-branch-quest-drifted-b' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/drifted-branch-quest' });
      const quest = QuestStub({
        id: questId,
        folder: '001-drifted-branch-quest',
        status: 'in_progress',
        branchName,
        worktreePath,
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });
      proxy.setupWorktreeDrifted({
        quest,
        worktreePath,
        branchName,
        currentBranchName: 'main',
      });

      const recoveredIds = await RecoverGuildLayerResponder({ guildItem });

      expect(recoveredIds).toStrictEqual([questId]);

      expect(proxy.getRestoreSpawnedArgs()).toStrictEqual([
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        ['checkout', branchName],
      ]);

      expect(proxy.getWorktreeRestoreCalls()).toStrictEqual([{ worktreePath, branchName }]);
    });

    // quest-resume-worktree:observable:resume-triggers-all-three — the startup-recovery third. The
    // argv proves the SHARED restore body ran here (a rev-parse then a bare `checkout <branch>`,
    // byte-identical to the argv the user-resume and dispatcher thirds assert in
    // orchestration-resume-responder.test.ts and scan-once-layer-broker.test.ts), and the log
    // line's `[recover-guild-layer-responder]` prefix is the one thing that differs between them.
    it('EDGE: {worktree drifted and the checkout back onto the quest branch fails} => the quest is still recovered, logging under this triggers own prefix', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-drifted-restore-fails' });
      const branchName = QuestBranchNameStub({ value: 'quest/drifted-restore-fails-d1e2f3a4' });
      const worktreePath = AbsoluteFilePathStub({
        value: '/repo/worktrees/drifted-restore-fails-quest',
      });
      const quest = QuestStub({
        id: questId,
        folder: '001-drifted-restore-fails-quest',
        status: 'in_progress',
        branchName,
        worktreePath,
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });
      const output =
        "error: pathspec 'quest/drifted-restore-fails-d1e2f3a4' did not match any file(s) known to git";

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });
      proxy.setupWorktreeRestoreFails({
        quest,
        worktreePath,
        branchName,
        currentBranchName: 'main',
        output,
      });

      const recoveredIds = await RecoverGuildLayerResponder({ guildItem });

      expect({
        recoveredIds,
        spawnedArgs: proxy.getRestoreSpawnedArgs(),
        stderrWrites: proxy.getRestoreStderrWrites(),
      }).toStrictEqual({
        recoveredIds: [questId],
        spawnedArgs: [
          ['rev-parse', '--abbrev-ref', 'HEAD'],
          ['checkout', branchName],
        ],
        stderrWrites: [
          `[recover-guild-layer-responder] worktree restore failed for quest ${questId} on branch ${branchName}: ${output}\n`,
        ],
      });
    });
  });

  describe('legacy quest with no recorded worktreePath', () => {
    it('VALID: {quest with no recorded worktreePath} => recovered exactly as before, not blocked, no git command run', async () => {
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildPath = GuildPathStub({ value: '/home/user/test-guild' });
      const questId = QuestIdStub({ value: 'quest-legacy-no-worktree' });
      const quest = QuestStub({
        id: questId,
        folder: '001-legacy-no-worktree-quest',
        status: 'in_progress',
      });
      const guildItem = GuildListItemStub({ id: guildId, path: guildPath, valid: true });

      const proxy = RecoverGuildLayerResponderProxy();
      proxy.setupGuildWithQuests({ guildId, guildPath, quests: [quest] });

      const recoveredIds = await RecoverGuildLayerResponder({ guildItem });

      expect(recoveredIds).toStrictEqual([questId]);

      const processIds = proxy.getRegisteredProcessIds();

      expect(processIds).toStrictEqual(['proc-recovery-f47ac10b-58cc-4372-a567-0e02b2c3d479']);

      expect(proxy.getRestoreSpawnedArgs()).toStrictEqual([]);
      expect(proxy.getWorktreeRestoreCalls()).toStrictEqual([]);
    });
  });
});
