import {
  PackageNameStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemRoleStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { OrchestrationStartResponderProxy } from './orchestration-start-responder.proxy';

const NEW_PATHSEEKER_ROLES = [
  WorkItemRoleStub({ value: 'pathseeker' }),
  WorkItemRoleStub({ value: 'pathseeker-surface' }),
  WorkItemRoleStub({ value: 'pathseeker-dedup' }),
  WorkItemRoleStub({ value: 'pathseeker-assertion-correctness' }),
  WorkItemRoleStub({ value: 'pathseeker-walk' }),
] as const;

describe('OrchestrationStartResponder', () => {
  describe('quest validation', () => {
    it('VALID: {questId with approved quest} => returns processId', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('ERROR: {questId not found} => throws quest not found error', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest not found: nonexistent/u,
      );
    });

    it('ERROR: {questId with non-approved quest} => throws status error listing startable statuses', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'created' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotApproved({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest must be in a startable status \(approved or design_approved\)\. Current status: created/u,
      );
    });

    it('VALID: {questId with design_approved quest} => returns processId', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'design_approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('ERROR: {questId with in_progress quest} => throws status error listing startable statuses', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress', steps: [] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotApproved({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest must be in a startable status \(approved or design_approved\)\. Current status: in_progress/u,
      );
    });
  });

  describe('quest status transition', () => {
    it('ERROR: {quest modify fails} => throws start error', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupModifyFailure({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Failed to start quest/u);
    });
  });

  describe('final transition lands on in_progress', () => {
    it('VALID: {approved quest} => first persisted status is seek_scope (carries workItems hop)', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const firstPersistedQuest = proxy.getPersistedQuestAt({ index: 0 });

      expect(firstPersistedQuest.status).toBe('seek_scope');
    });

    it('VALID: {design_approved quest} => first persisted status is seek_scope (carries workItems hop)', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'design_approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const firstPersistedQuest = proxy.getPersistedQuestAt({ index: 0 });

      expect(firstPersistedQuest.status).toBe('seek_scope');
    });

    it('VALID: {approved quest} => last persisted status is in_progress (so /dumpster-launch picks it up)', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedContents = proxy.getAllPersistedContents();
      const lastPersistedQuest = proxy.getPersistedQuestAt({
        index: persistedContents.length - 1,
      });

      expect(lastPersistedQuest.status).toBe('in_progress');
    });

    it('VALID: {design_approved quest} => last persisted status is in_progress (so /dumpster-launch picks it up)', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'design_approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedContents = proxy.getAllPersistedContents();
      const lastPersistedQuest = proxy.getPersistedQuestAt({
        index: persistedContents.length - 1,
      });

      expect(lastPersistedQuest.status).toBe('in_progress');
    });
  });

  describe('pathseeker graph creation (single planning work item)', () => {
    it('VALID: {approved quest with packagesAffected=["orchestrator"]} => persists a single pathseeker work item', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const newPathseekerRoles = persistedQuest.workItems
        .map((wi) => wi.role)
        .filter((role) => NEW_PATHSEEKER_ROLES.includes(role));

      expect(newPathseekerRoles).toStrictEqual(['pathseeker']);
    });

    it('VALID: {approved quest with packagesAffected=["a","b"]} => still persists exactly one pathseeker work item', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        packagesAffected: [
          PackageNameStub({ value: 'orchestrator' }),
          PackageNameStub({ value: 'web' }),
        ],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const newPathseekerRoles = persistedQuest.workItems
        .map((wi) => wi.role)
        .filter((role) => NEW_PATHSEEKER_ROLES.includes(role));

      expect(newPathseekerRoles).toStrictEqual(['pathseeker']);
    });

    it('VALID: {approved quest with empty packagesAffected} => default-slice plan still emits one pathseeker item', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const newPathseekerRoles = persistedQuest.workItems
        .map((wi) => wi.role)
        .filter((role) => NEW_PATHSEEKER_ROLES.includes(role));

      expect(newPathseekerRoles).toStrictEqual(['pathseeker']);
    });

    it('VALID: {approved quest with packagesAffected=["orchestrator"]} => the pathseeker item is an agent spawner', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const pathseeker = persistedQuest.workItems.find((wi) => wi.role === 'pathseeker');

      expect(pathseeker?.spawnerType).toBe('agent');
    });

    it('VALID: {quest already has pathseeker-walk} => does not insert another graph', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const existingWalk = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        role: 'pathseeker-walk',
        status: 'pending',
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        workItems: [existingWalk],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const walkItems = persistedQuest.workItems.filter((wi) => wi.role === 'pathseeker-walk');

      expect(walkItems).toStrictEqual([existingWalk]);
    });

    it('VALID: {quest already has a pathseeker work item} => does not insert another graph', async () => {
      questExecutionQueueState.clear();
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

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const surfaceItems = persistedQuest.workItems.filter(
        (wi) => wi.role === 'pathseeker-surface',
      );

      expect(surfaceItems).toStrictEqual([]);
    });

    it('ERROR: {modify-quest fails on the work-items insertion} => throws start error', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupPathseekerInsertFailure({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Failed to start quest/u);
    });
  });

  describe('scopeClassification persistence', () => {
    it('VALID: {approved quest with packagesAffected=["orchestrator","web"]} => responder completes without throwing (scopeClassification persist runs as a follow-up modify-quest; full persistence is covered by integration tests)', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        packagesAffected: [
          PackageNameStub({ value: 'orchestrator' }),
          PackageNameStub({ value: 'web' }),
        ],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('chat work item promotion on start', () => {
    it('VALID: {approved quest with pending chaos} => chaos promoted to complete with completedAt', async () => {
      questExecutionQueueState.clear();
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

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const chaosItems = persistedQuest.workItems.filter((wi) => wi.role === 'chaoswhisperer');

      expect(chaosItems[0]?.status).toBe('complete');
      expect(String(chaosItems[0]?.completedAt)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
      );
    });

    it('VALID: {approved quest with pending glyphsmith} => glyph promoted to complete with completedAt', async () => {
      questExecutionQueueState.clear();
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

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const glyphItems = persistedQuest.workItems.filter((wi) => wi.role === 'glyphsmith');

      expect(glyphItems[0]?.status).toBe('complete');
      expect(String(glyphItems[0]?.completedAt)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u,
      );
    });

    it('VALID: {approved quest with pending chaos} => the new pathseeker item depends on chaos id', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const chaosItem = WorkItemStub({
        id: chaosId,
        role: 'chaoswhisperer',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
        workItems: [chaosItem],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const pathseekerItem = persistedQuest.workItems.find((wi) => wi.role === 'pathseeker');

      expect(pathseekerItem?.dependsOn).toStrictEqual([chaosId]);
    });

    it('VALID: {approved quest with failed chaos} => failed chaos NOT promoted', async () => {
      questExecutionQueueState.clear();
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

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const chaosItems = persistedQuest.workItems.filter((wi) => wi.role === 'chaoswhisperer');

      expect(chaosItems[0]?.status).toBe('failed');
    });
  });

  describe('bug-hunt quest graph creation', () => {
    it('VALID: {approved bug-hunt quest} => persists pesteater → ward → lawbringer → blightwarden → ward', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({ id: questId, status: 'approved', questType: 'bug-hunt' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const roles = persistedQuest.workItems.map((wi) => wi.role);

      expect(roles).toStrictEqual(['pesteater', 'ward', 'lawbringer', 'blightwarden', 'ward']);
    });

    it('VALID: {approved bug-hunt quest} => seeds no pathseeker work items', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({ id: questId, status: 'approved', questType: 'bug-hunt' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const pathseekerItems = persistedQuest.workItems.filter((wi) =>
        NEW_PATHSEEKER_ROLES.includes(wi.role),
      );

      expect(pathseekerItems).toStrictEqual([]);
    });

    it('VALID: {approved bug-hunt quest} => last persisted status is in_progress', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({ id: questId, status: 'approved', questType: 'bug-hunt' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const persistedContents = proxy.getAllPersistedContents();
      const lastPersistedQuest = proxy.getPersistedQuestAt({
        index: persistedContents.length - 1,
      });

      expect(lastPersistedQuest.status).toBe('in_progress');
    });
  });

  describe('queue enqueue behavior', () => {
    it('VALID: {approved quest} => enqueues exactly one queue entry with questId, guildId, title', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved', title: 'Add Authentication' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const entries = questExecutionQueueState.getAll();
      const summary = entries.map((e) => ({
        questId: e.questId,
        guildId: e.guildId,
        questTitle: e.questTitle,
      }));

      expect(summary).toStrictEqual([
        {
          questId,
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          questTitle: 'Add Authentication',
        },
      ]);
    });

    it('VALID: {approved quest} => queue entry status matches what questGetBroker returned (the test proxy keeps status stable)', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      await proxy.callResponder({ questId });

      const entries = questExecutionQueueState.getAll();

      expect(entries[0]?.status).toBe('approved');
    });

    it('VALID: {registered placeholder process killed after start (pause path)} => queue entry SURVIVES', async () => {
      questExecutionQueueState.clear();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved', title: 'Add Authentication' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const processId = await proxy.callResponder({ questId });
      // questPauseBroker kills the quest's registered process on pause — that kill must
      // NOT dequeue the entry, or a paused quest silently vanishes from the queue.
      orchestrationProcessesState.kill({ processId });

      const entries = questExecutionQueueState.getAll();

      expect(entries.map((e) => e.questId)).toStrictEqual([questId]);
    });
  });
});
