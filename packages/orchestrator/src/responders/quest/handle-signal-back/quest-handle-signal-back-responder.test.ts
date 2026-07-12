import {
  DependencyStepStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { codeRecoveryRolesTransformer } from '../../../transformers/code-recovery-roles/code-recovery-roles-transformer';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { QuestHandleSignalBackResponderProxy } from './quest-handle-signal-back-responder.proxy';

type PersistedQuest = ReturnType<typeof QuestStub>;

const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/u;

// Every role whose `failed` (code) routes to a spiritmender recovery and whose `failed-replan` (plan
// hole) routes to a PathSeeker replan — derived by exclusion from workItemRoleContract, so a NEW role
// is picked up here automatically (recovery-first, never an immediate block).
const CODE_RECOVERY_ROLES = codeRecoveryRolesTransformer();

const parseLatestPersisted = (persisted: readonly unknown[]): PersistedQuest => {
  const raw = persisted[persisted.length - 1];
  const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return QuestStub(parsed as Parameters<typeof QuestStub>[0]);
};

describe('QuestHandleSignalBackResponder', () => {
  describe('status transition — complete', () => {
    it('VALID: {role: codeweaver, signal: complete} => persists workItem.status=complete with completedAt', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const codeweaverItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [codeweaverItem] });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({ questId, workItemId: itemId, signal: 'complete' });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const transitioned = persistedQuest.workItems.find((wi) => wi.id === itemId);

      expect(transitioned?.status).toBe('complete');
      expect(String(transitioned?.completedAt)).toMatch(ISO_TIMESTAMP_RE);
    });

    it('VALID: {pathseeker-surface complete, dedup pending depending on it} => surface persists complete so dedup becomes ready', async () => {
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

      await QuestHandleSignalBackResponder({ questId, workItemId: surfaceId, signal: 'complete' });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persistedQuest.workItems.find((wi) => wi.id === surfaceId)?.status).toBe('complete');
    });
  });

  describe('blightwarden minion — non-blocking', () => {
    it.each([
      ['failed', 'blightwarden-security-minion'],
      ['failed-replan', 'blightwarden-perf-minion'],
    ] as const)(
      'VALID: {role: %2$s, signal: %1$s} => minion terminates complete (non-blocking), actualSignal records the real signal',
      async (signal, role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const questId = QuestIdStub({ value: 'add-auth' });
        const minionId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
        const synthId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
        const minionItem = WorkItemStub({ id: minionId, role, status: 'in_progress' });
        const synthItem = WorkItemStub({
          id: synthId,
          role: 'blightwarden',
          status: 'pending',
          dependsOn: [minionId],
        });
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [minionItem, synthItem],
        });
        proxy.setupQuest({ quest });

        await QuestHandleSignalBackResponder({ questId, workItemId: minionId, signal });

        const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
        const transitioned = persistedQuest.workItems.find((wi) => wi.id === minionId);

        expect(transitioned?.status).toBe('complete');
        expect(transitioned?.actualSignal).toBe(signal);
        expect(persistedQuest.status).toBe('in_progress');
      },
    );
  });

  describe('code-recovery roles — failed routes to spiritmender recovery (NEVER an immediate block)', () => {
    it.each(CODE_RECOVERY_ROLES)(
      'VALID: {role: %s, signal: failed} => item marked failed, quest stays in_progress (recovery-first), delegates to questRecoverRoleBroker',
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const questId = QuestIdStub({ value: 'add-auth' });
        const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
        const failedItem = WorkItemStub({
          id: failedId,
          role,
          status: 'in_progress',
          attempt: 0,
          maxAttempts: 3,
        });
        const pendingItem = WorkItemStub({
          id: pendingId,
          role: 'lawbringer',
          status: 'pending',
          dependsOn: [failedId],
        });
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [failedItem, pendingItem],
        });
        proxy.setupQuest({ quest });

        await QuestHandleSignalBackResponder({ questId, workItemId: failedId, signal: 'failed' });

        const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());

        expect({
          failedStatus: persistedQuest.workItems.find((wi) => wi.id === failedId)?.status,
          questStatus: persistedQuest.status,
          recoverCallCount: proxy.getRecoverCalls().length,
        }).toStrictEqual({
          failedStatus: 'failed',
          questStatus: 'in_progress',
          recoverCallCount: 1,
        });
      },
    );

    it('VALID: {role: codeweaver, signal: failed, summary} => delegates to questRecoverRoleBroker with the finding', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const cwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cwItem = WorkItemStub({
        id: cwId,
        role: 'codeweaver',
        status: 'in_progress',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [cwItem] });
      proxy.setupQuest({ quest });
      const { summary: finding } = WorkItemStub({ summary: 'CLI slice needs ink; not installed' });

      await QuestHandleSignalBackResponder({
        questId,
        workItemId: cwId,
        signal: 'failed',
        summary: finding,
      });

      expect(proxy.getRecoverCalls()).toStrictEqual([
        [{ questId, failedWorkItemId: cwId, finding }],
      ]);
    });
  });

  describe('code-recovery roles — failed-replan routes to a PathSeeker replan (NEVER an immediate block)', () => {
    it.each(CODE_RECOVERY_ROLES)(
      'VALID: {role: %s, signal: failed-replan} => delegates to questSplicePathseekerReplanBroker, responder itself blocks nothing',
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const questId = QuestIdStub({ value: 'add-auth' });
        const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const failedItem = WorkItemStub({ id: failedId, role, status: 'in_progress' });
        const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [failedItem] });
        proxy.setupQuest({ quest });
        const { summary: brief } = WorkItemStub({
          summary: 'contract shape changed; add adapter step',
        });

        await QuestHandleSignalBackResponder({
          questId,
          workItemId: failedId,
          signal: 'failed-replan',
          summary: brief,
        });

        // The replan broker owns the mark-failed + skip + splice; the responder persists nothing itself
        // and never blocks.
        expect({
          replanCalls: proxy.getReplanCalls(),
          responderPersistedWrites: proxy.getAllPersistedContents().length,
        }).toStrictEqual({
          replanCalls: [
            [{ questId, failedWorkItemId: failedId, brief, actualSignal: 'failed-replan' }],
          ],
          responderPersistedWrites: 0,
        });
      },
    );
  });

  describe('spiritmender — soft fail (mark failed, no further recovery)', () => {
    it('VALID: {role: spiritmender, signal: failed} => item marked failed, no recover/replan/block, quest stays in_progress', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const spiritId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const wardId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const spiritItem = WorkItemStub({
        id: spiritId,
        role: 'spiritmender',
        status: 'in_progress',
      });
      // A ward re-verify depends on the spiritmender; `failed` satisfies dependsOn so it still runs.
      const wardItem = WorkItemStub({
        id: wardId,
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        dependsOn: [spiritId],
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [spiritItem, wardItem],
      });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({ questId, workItemId: spiritId, signal: 'failed' });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());

      expect({
        spiritStatus: persistedQuest.workItems.find((wi) => wi.id === spiritId)?.status,
        spiritActualSignal: persistedQuest.workItems.find((wi) => wi.id === spiritId)?.actualSignal,
        questStatus: persistedQuest.status,
        recoverCalls: proxy.getRecoverCalls().length,
        replanCalls: proxy.getReplanCalls().length,
      }).toStrictEqual({
        spiritStatus: 'failed',
        spiritActualSignal: 'failed',
        questStatus: 'in_progress',
        recoverCalls: 0,
        replanCalls: 0,
      });
    });
  });

  describe('pathseeker — retry within its loop, block only when exhausted (the sole block owner)', () => {
    it('VALID: {role: pathseeker, signal: failed, attempt 0/3} => reset to pending with attempt+1 and identity cleared (retry)', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const psItem = WorkItemStub({
        id: psId,
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [psItem] });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({ questId, workItemId: psId, signal: 'failed' });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const ps = persistedQuest.workItems.find((wi) => wi.id === psId);

      expect({
        status: ps?.status,
        attempt: ps?.attempt,
        questStatus: persistedQuest.status,
      }).toStrictEqual({
        status: 'pending',
        attempt: 1,
        questStatus: 'in_progress',
      });
    });

    it('VALID: {role: pathseeker, signal: failed, attempt 2/3 (exhausted)} => marked failed and quest BLOCKED', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const psItem = WorkItemStub({
        id: psId,
        role: 'pathseeker',
        status: 'in_progress',
        attempt: 2,
        maxAttempts: 3,
      });
      const pendingItem = WorkItemStub({
        id: pendingId,
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [psId],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [psItem, pendingItem],
      });
      proxy.setupQuestBlockPassthrough({ quest });

      await QuestHandleSignalBackResponder({ questId, workItemId: psId, signal: 'failed' });

      const persistedQuest = proxy.getLastPersistedQuest();

      expect({
        psStatus: persistedQuest.workItems.find((wi) => wi.id === psId)?.status,
        pendingStatus: persistedQuest.workItems.find((wi) => wi.id === pendingId)?.status,
        questStatus: persistedQuest.status,
      }).toStrictEqual({
        psStatus: 'failed',
        pendingStatus: 'skipped',
        questStatus: 'blocked',
      });
    });
  });

  describe('pathseeker post-walk hook', () => {
    it('VALID: {role: pathseeker, signal: complete} => transitions complete AND invokes post-walk hook (generates ward/blightwarden/final-ward chain)', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      proxy.setupWalkHookUuids({
        uuids: [
          'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b',
          'd2d3d4d5-e6e7-4f8a-9b1c-2d3e4f5a6b7c',
          'e3e4e5e6-f7f8-4a9b-8c1d-3e4f5a6b7c8d',
        ],
      });
      const walkItem = WorkItemStub({ id: walkId, role: 'pathseeker', status: 'in_progress' });
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
      const generatedRoles = persistedQuest.workItems
        .filter((wi) => wi.id !== walkId)
        .map((wi) => wi.role);

      expect(generatedRoles).toStrictEqual(['ward', 'blightwarden', 'ward']);
    });

    it('ERROR: {role: pathseeker, signal: complete, post-walk hook throws on an invalid plan} => quest BLOCKED with pathseeker failed, never falsely complete', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({ id: walkId, role: 'pathseeker', status: 'in_progress' });
      const invalidStep = DependencyStepStub({
        id: 'backend-references-ghost',
        inputContracts: ['GhostContract'],
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [walkItem],
        steps: [invalidStep],
        flows: [],
        contracts: [],
      });
      proxy.setupQuestBlockPassthrough({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: walkId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });

      const persistedQuest = proxy.getLastPersistedQuest();
      const persistedWalk = persistedQuest.workItems.find((wi) => wi.id === walkId);

      expect({
        questStatus: persistedQuest.status,
        walkStatus: persistedWalk?.status,
      }).toStrictEqual({
        questStatus: 'blocked',
        walkStatus: 'failed',
      });
    });
  });

  describe('quest load / persist failures surface (never silently drop the signal)', () => {
    it('ERROR: {quest cannot be loaded (corrupt quest.json)} => throws instead of silently returning success', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      proxy.setupQuestUnreadable();

      await expect(
        QuestHandleSignalBackResponder({ questId, workItemId: itemId, signal: 'complete' }),
      ).rejects.toThrow(/could not load quest/u);
    });

    it('ERROR: {persist of the complete transition resolves success:false} => throws instead of reporting success', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const item = WorkItemStub({ id: itemId, role: 'siegemaster', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [item] });
      proxy.setupQuestModifyFails({ quest });

      await expect(
        QuestHandleSignalBackResponder({ questId, workItemId: itemId, signal: 'complete' }),
      ).rejects.toThrow(/quest modify failed to persist/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {workItem not in quest} => no-op, returns success without throwing', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const missingId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [] });
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
