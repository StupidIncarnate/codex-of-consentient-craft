import {
  DependencyStepStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { QuestHandleSignalBackResponderProxy } from './quest-handle-signal-back-responder.proxy';

type PersistedQuest = ReturnType<typeof QuestStub>;

const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/u;

// The per-role routing table's BLOCK set: every agent role this responder routes to BLOCK on
// a `failed` signal. `lawbringer` is included — it fixes its findings inline, so a `failed`
// signal means something genuinely unfixable, the same BLOCK semantics as every other role.
// `pathseeker` is the active planner: its `complete` fires the post-walk hook, its `failed`
// routes to BLOCK like any other agent. `ward` is excluded (command role, terminal status set by
// run-ward, never reaches this responder); chat roles (`chaoswhisperer`/`glyphsmith`) never
// signal-back. The deprecated `pathseeker-surface`/`-dedup`/`-assertion-correctness`/`-walk` roles
// are no longer seeded (PathSeeker summons them as sub-agents) but still route to BLOCK if an old
// quest.json work item under those roles signals `failed`. WorkItemRole value-import is banned in
// test files, so the routing-table subset is enumerated explicitly.
const BLOCK_ROLES = [
  'lawbringer',
  'codeweaver',
  'flowrider',
  'siegemaster',
  'spiritmender',
  'blightwarden',
  'pathseeker',
  'pathseeker-surface',
  'pathseeker-dedup',
  'pathseeker-assertion-correctness',
  'pathseeker-walk',
  'pesteater',
] as const;

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

    it('VALID: {role: blightwarden, signal: failed-replan} => persists synthesizer workItem.status=failed with completedAt set', async () => {
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
        // Synthesizer depends on the minion — proving the minion's terminal `complete` keeps the
        // dependency satisfiable rather than blocking the quest.
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
        // Quest is NOT blocked — the failure lives in the minion's report, not its work-item status.
        expect(persistedQuest.status).toBe('in_progress');
      },
    );

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

  describe('pathseeker post-walk hook', () => {
    it('VALID: {role: pathseeker, signal: complete} => transitions to complete AND invokes post-walk hook (generates ward/blightwarden/final-ward chain)', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      // The hook's stepsToWorkItemsTransformer mints one UUID per generated item; queue distinct
      // ids so the persisted chain has unique sibling ids (empty steps/flows => ward + blightwarden
      // + final-ward = 3 items).
      proxy.setupWalkHookUuids({
        uuids: [
          'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b',
          'd2d3d4d5-e6e7-4f8a-9b1c-2d3e4f5a6b7c',
          'e3e4e5e6-f7f8-4a9b-8c1d-3e4f5a6b7c8d',
        ],
      });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker',
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

      // The LAST persisted write is the hook's modify call — proves the hook fired. It carries
      // the generated downstream chain (the only writer of ward/minion/blightwarden items here).
      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());
      const generatedRoles = persistedQuest.workItems
        .filter((wi) => wi.id !== walkId)
        .map((wi) => wi.role);

      expect(generatedRoles).toStrictEqual(['ward', 'blightwarden', 'ward']);
    });

    it('ERROR: {role: pathseeker, signal: complete, post-walk hook throws on an invalid plan} => quest BLOCKED with pathseeker failed, never falsely complete', async () => {
      // Reproduces the real failure that stranded quest ea97db12 ("Delete Quest Button"):
      // PathSeeker signalled complete, but the post-walk completeness validation threw
      // because a step's inputContracts referenced a contract absent from quest.contracts[].
      // The responder must convert that throw into a BLOCK — not leave the quest derived
      // `complete` (terminal, never re-scanned) with no implementation chain.
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker',
        status: 'in_progress',
      });
      // The unresolved step→contract ref that makes the REAL post-walk completeness scope
      // (questValidateSpecTransformer scope 'completeness') throw: 'GhostContract' is not in
      // quest.contracts[] and is not the Void sentinel.
      // id must keep the default 'backend' slice prefix so the only failing check is the
      // completeness contract-ref scope (run solely by the post-walk hook) — a slice-prefix
      // mismatch would instead trip the per-write save-invariants on every modify call.
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

    it('VALID: {role: pathseeker, signal: failed} => transitions to failed, does NOT invoke post-walk hook', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker',
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

  describe('failed-role BLOCK routing', () => {
    it.each(BLOCK_ROLES)(
      'VALID: {role: %s, signal: failed} => quest status blocked AND every pending item skipped',
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const questId = QuestIdStub({ value: 'add-auth' });
        const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
        const failedItem = WorkItemStub({ id: failedId, role, status: 'in_progress' });
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
        proxy.setupQuestBlockPassthrough({ quest });

        await QuestHandleSignalBackResponder({ questId, workItemId: failedId, signal: 'failed' });

        const persistedQuest = proxy.getLastPersistedQuest();

        expect(persistedQuest.status).toBe('blocked');
        expect(persistedQuest.workItems.find((wi) => wi.id === failedId)?.status).toBe('failed');
        expect(persistedQuest.workItems.find((wi) => wi.id === pendingId)?.status).toBe('skipped');
      },
    );
  });

  describe('synthesizer failed-replan splices a pathseeker replan', () => {
    it('VALID: {role: blightwarden, signal: failed-replan} => synthesizer failed, pending skipped, pathseeker replan inserted, quest stays in_progress', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const synthId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const finalWardId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const synthItem = WorkItemStub({
        id: synthId,
        role: 'blightwarden',
        status: 'in_progress',
      });
      const finalWard = WorkItemStub({
        id: finalWardId,
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        dependsOn: [synthId],
        wardMode: 'full',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [synthItem, finalWard],
      });
      proxy.setupQuest({ quest });

      await QuestHandleSignalBackResponder({
        questId,
        workItemId: synthId,
        signal: 'failed-replan',
      });

      const persistedQuest = parseLatestPersisted(proxy.getAllPersistedContents());

      // Synthesizer marked failed (superseded by the replan it inserted); the pending final ward is
      // skipped; a pathseeker replan was spliced (depends on nothing, inserted by the failed
      // synthesizer — the quest had no pathseeker item before, so this is unambiguously it); and
      // the quest re-opens for the replan rather than blocking.
      const synth = persistedQuest.workItems.find((wi) => wi.id === synthId);
      const finalWardItem = persistedQuest.workItems.find((wi) => wi.id === finalWardId);
      const replan = persistedQuest.workItems.find((wi) => wi.role === 'pathseeker');

      expect({
        synthStatus: synth?.status,
        synthActualSignal: synth?.actualSignal,
        finalWardStatus: finalWardItem?.status,
        replanStatus: replan?.status,
        replanInsertedBy: replan?.insertedBy,
        replanDependsOn: replan?.dependsOn,
        questStatus: persistedQuest.status,
      }).toStrictEqual({
        synthStatus: 'failed',
        synthActualSignal: 'failed-replan',
        finalWardStatus: 'skipped',
        replanStatus: 'pending',
        replanInsertedBy: synthId,
        replanDependsOn: [],
        questStatus: 'in_progress',
      });
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
