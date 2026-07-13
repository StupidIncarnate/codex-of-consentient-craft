/**
 * PURPOSE: Tests for RecoverGuildLayerResponder verifying quest recovery filtering and process registration
 *
 * USAGE:
 * npm run ward -- --only test -- recover-guild-layer-responder.test.ts
 */

import {
  GuildIdStub,
  GuildListItemStub,
  GuildPathStub,
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
      proxy.setupGuildDirectoryReadFailure({ guildId, guildPath, error: enoentError });

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
      proxy.setupGuildDirectoryReadFailure({ guildId, guildPath, error: permissionError });

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
});
