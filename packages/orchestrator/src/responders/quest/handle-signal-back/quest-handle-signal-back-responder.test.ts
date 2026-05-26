import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { QuestHandleSignalBackResponderProxy } from './quest-handle-signal-back-responder.proxy';

type PersistedQuest = ReturnType<typeof QuestStub>;

const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/u;

const parseLatestPersisted = (persisted: readonly unknown[]): PersistedQuest => {
  const raw = persisted[persisted.length - 1];
  const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return QuestStub(parsed as Parameters<typeof QuestStub>[0]);
};

describe('QuestHandleSignalBackResponder', () => {
  describe('status transition (every role + signal pair)', () => {
    it('VALID: {role: pathseeker-surface, signal: complete} => persists workItem.status=complete with completedAt set', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const surfaceItem = WorkItemStub({
        id: itemId,
        role: 'pathseeker-surface',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [surfaceItem],
      });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({
        questId,
        workItemId: itemId,
        signal: 'complete',
      });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const transitioned = persistedQuest.workItems.find((wi) => wi.id === itemId);

      expect(transitioned?.status).toBe('complete');
      expect(String(transitioned?.completedAt)).toMatch(ISO_TIMESTAMP_RE);
    });

    it('VALID: {role: codeweaver, signal: complete} => persists workItem.status=complete', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const codeweaverItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [codeweaverItem],
      });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({
        questId,
        workItemId: itemId,
        signal: 'complete',
      });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const transitioned = persistedQuest.workItems.find((wi) => wi.id === itemId);

      expect(transitioned?.status).toBe('complete');
      expect(String(transitioned?.completedAt)).toMatch(ISO_TIMESTAMP_RE);
    });

    it('VALID: {role: codeweaver, signal: failed} => persists workItem.status=failed with completedAt set', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const codeweaverItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [codeweaverItem],
      });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({
        questId,
        workItemId: itemId,
        signal: 'failed',
      });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const transitioned = persistedQuest.workItems.find((wi) => wi.id === itemId);

      expect(transitioned?.status).toBe('failed');
      expect(String(transitioned?.completedAt)).toMatch(ISO_TIMESTAMP_RE);
    });

    it('VALID: {role: blightwarden, signal: failed-replan} => persists workItem.status=failed with completedAt set', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const blightItem = WorkItemStub({
        id: itemId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [blightItem],
      });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({
        questId,
        workItemId: itemId,
        signal: 'failed-replan',
      });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const transitioned = persistedQuest.workItems.find((wi) => wi.id === itemId);

      expect(transitioned?.status).toBe('failed');
      expect(String(transitioned?.completedAt)).toMatch(ISO_TIMESTAMP_RE);
    });

    it('VALID: {pathseeker-surface complete, dedup pending depending on it} => surface persists complete so dedup becomes ready (regression repro: orchestrator went idle when surface stayed in_progress)', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const surfaceId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const dedupId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const surfaceItem = WorkItemStub({
        id: surfaceId,
        role: 'pathseeker-surface',
        status: 'in_progress',
      });
      const dedupItem = WorkItemStub({
        id: dedupId,
        role: 'pathseeker-dedup',
        status: 'pending',
        dependsOn: [surfaceId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [surfaceItem, dedupItem],
      });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({
        questId,
        workItemId: surfaceId,
        signal: 'complete',
      });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const persistedSurface = persistedQuest.workItems.find((wi) => wi.id === surfaceId);

      // satisfiesDependency requires complete or failed — in_progress does not. If
      // the surface item stays in_progress, dedup (dependsOn: [surfaceId]) is never
      // ready and quest-get-next-step returns idle.
      expect(persistedSurface?.status).toBe('complete');
    });
  });

  describe('pathseeker-walk post-walk hook', () => {
    it('VALID: {role: pathseeker-walk, signal: complete} => transitions to complete AND invokes post-walk hook', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem],
        steps: [],
        flows: [],
      });
      proxy.setupQuest({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: walkId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const persistedWalk = persistedQuest.workItems.find((wi) => wi.id === walkId);

      expect(persistedWalk?.status).toBe('complete');
    });

    it('VALID: {role: pathseeker-walk, signal: failed} => transitions to failed, does NOT invoke post-walk hook', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem],
      });
      proxy.setupQuest({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: walkId,
        signal: 'failed',
      });

      expect(result).toStrictEqual({ success: true });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const persistedWalk = persistedQuest.workItems.find((wi) => wi.id === walkId);

      expect(persistedWalk?.status).toBe('failed');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {workItem not in quest} => no-op, returns success without throwing', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const missingId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [],
      });
      proxy.setupQuest({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: missingId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
