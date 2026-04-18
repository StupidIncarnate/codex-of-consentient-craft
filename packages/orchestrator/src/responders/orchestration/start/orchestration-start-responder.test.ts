import {
  QuestStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { OrchestrationStartResponderProxy } from './orchestration-start-responder.proxy';

describe('OrchestrationStartResponder', () => {
  describe('quest validation', () => {
    it('VALID: {questId with approved quest} => returns processId', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('ERROR: {questId not found} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest not found: nonexistent/u,
      );
    });

    it('ERROR: {questId with non-approved quest} => throws status error', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'created' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotApproved({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest must be approved before starting\. Current status: created/u,
      );
    });

    it('VALID: {questId with design_approved quest} => returns processId', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'design_approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('ERROR: {questId with in_progress quest} => throws status error', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress', steps: [] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotApproved({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest must be approved before starting\. Current status: in_progress/u,
      );
    });
  });

  describe('quest status transition', () => {
    it('ERROR: {quest modify fails} => throws start error', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupModifyFailure({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Failed to start quest/u);
    });
  });

  describe('always transitions to seek_scope on start', () => {
    it('VALID: {approved quest} => persisted status is seek_scope', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();

      expect(persistedQuest.status).toBe('seek_scope');
    });

    it('VALID: {design_approved quest} => persisted status is seek_scope', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'design_approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();

      expect(persistedQuest.status).toBe('seek_scope');
    });
  });

  describe('pathseeker work item creation', () => {
    it('VALID: {approved quest with completed chaos} => persists pathseeker with correct identity', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'complete',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chaosItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(pathseekerItems[0]?.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(pathseekerItems[0]?.role).toBe('pathseeker');
      expect(pathseekerItems[0]?.status).toBe('pending');
      expect(pathseekerItems[0]?.spawnerType).toBe('agent');
    });

    it('VALID: {approved quest with completed chaos} => persists pathseeker with correct config', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'complete',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chaosItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');
      const [pathseeker] = pathseekerItems;

      expect(pathseeker?.dependsOn).toStrictEqual([chaosId]);
      expect(pathseeker?.maxAttempts).toBe(3);
    });

    it('VALID: {approved quest with no work items} => persists pathseeker with empty dependsOn', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(pathseekerItems[0]?.dependsOn).toStrictEqual([]);
    });

    it('VALID: {quest already has pathseeker} => does not create duplicate pathseeker', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const existingPathseeker = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        role: 'pathseeker',
        status: 'pending',
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        workItems: [existingPathseeker],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(pathseekerItems[0]?.id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });

    it('ERROR: {pathseeker insert fails} => throws pathseeker creation error', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupPathseekerInsertFailure({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Failed to start quest/u);
    });

    it('VALID: {approved quest with chaos and glyphsmith complete} => pathseeker depends on both', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const glyphId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'complete',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const glyphItem = WorkItemStub({
        id: glyphId,
        role: 'glyphsmith',
        status: 'complete',
        createdAt: '2024-01-15T11:00:00.000Z',
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        workItems: [chaosItem, glyphItem],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(pathseekerItems[0]?.dependsOn).toStrictEqual([chaosId, glyphId]);
    });
  });

  describe('chat work item promotion on start', () => {
    it('VALID: {approved quest with pending chaos} => chaos promoted to complete with completedAt', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chaosItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const chaosItems = persistedQuest.workItems.filter((wi) => wi.role === 'chaoswhisperer');

      expect(chaosItems[0]?.status).toBe('complete');
      expect(String(chaosItems[0]?.completedAt)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
      );
    });

    it('VALID: {approved quest with pending glyphsmith} => glyph promoted to complete with completedAt', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const glyphId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const glyphItem = WorkItemStub({
        id: glyphId,
        role: 'glyphsmith',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [glyphItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const glyphItems = persistedQuest.workItems.filter((wi) => wi.role === 'glyphsmith');

      expect(glyphItems[0]?.status).toBe('complete');
      expect(String(glyphItems[0]?.completedAt)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
      );
    });

    it('VALID: {approved quest with pending chaos and glyph} => both promoted, pathseeker depends on both', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const glyphId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const glyphItem = WorkItemStub({
        id: glyphId,
        role: 'glyphsmith',
        status: 'pending',
        createdAt: '2024-01-15T11:00:00.000Z',
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        workItems: [chaosItem, glyphItem],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const chaosItems = persistedQuest.workItems.filter((wi) => wi.role === 'chaoswhisperer');
      const glyphItems = persistedQuest.workItems.filter((wi) => wi.role === 'glyphsmith');
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(chaosItems[0]?.status).toBe('complete');
      expect(glyphItems[0]?.status).toBe('complete');
      expect(pathseekerItems[0]?.dependsOn).toStrictEqual([chaosId, glyphId]);
    });

    it('VALID: {approved quest with already-complete chaos} => chaos stays complete, pathseeker depends on it', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'complete',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chaosItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const chaosItems = persistedQuest.workItems.filter((wi) => wi.role === 'chaoswhisperer');
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(chaosItems[0]?.status).toBe('complete');
      expect(pathseekerItems[0]?.dependsOn).toStrictEqual([chaosId]);
    });

    it('VALID: {approved quest with failed chaos} => failed chaos NOT promoted', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'failed',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chaosItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const chaosItems = persistedQuest.workItems.filter((wi) => wi.role === 'chaoswhisperer');

      expect(chaosItems[0]?.status).toBe('failed');
    });
  });

  describe('sequential modify atomicity (H-1 root cause)', () => {
    it('VALID: {approved quest with chaos complete} => final persisted quest status is seek_scope', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'complete',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chaosItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      // The responder does two sequential questModifyBroker calls:
      //   1. Set status: approved → seek_scope
      //   2. Insert pathseeker work item
      // If the second call loads stale data (pre-status-change quest),
      // it overwrites status back to 'approved'. The loop then sees only
      // chaos=complete → terminal → quest=complete. This is the H-1 bug.
      const persistedQuest = proxy.getLastPersistedQuest();

      expect(persistedQuest.status).toBe('seek_scope');
    });

    it('VALID: {approved quest with chaos complete} => final persisted quest has pathseeker with seek_scope status context', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'complete',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chaosItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getLastPersistedQuest();
      const pathseekerItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker');

      // Both status=seek_scope AND pathseeker must coexist in the final write.
      // Status regression means the loop will see terminal state and skip pathseeker.
      expect(persistedQuest.status).toBe('seek_scope');
      expect(pathseekerItems[0]?.role).toBe('pathseeker');
      expect(pathseekerItems[0]?.status).toBe('pending');
      expect(pathseekerItems[0]?.dependsOn).toStrictEqual([chaosId]);
    });
  });
});
