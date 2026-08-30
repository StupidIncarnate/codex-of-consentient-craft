import {
  BlockedReasonStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestBlightLedgerEntryStub,
  QuestIdStub,
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { QuestHandleSignalBackResponderProxy } from './quest-handle-signal-back-responder.proxy';

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const ITEM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const PENDING_ITEM_ID = 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e';
const OP1_ID = '11111111-1111-4111-8111-111111111111';
const OP2_ID = '22222222-2222-4222-8222-222222222222';
const OP3_ID = '33333333-3333-4333-8333-333333333333';
const CONTINUATION_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const ADVANCE_UUID = '99999999-9999-4999-8999-999999999999';

// The (fictional) changed file the commit-before-signal gate tests below stage as an uncommitted
// path, and the file the sample blightLedger disposition below names.
const BLIGHT_FILE = 'packages/orchestrator/src/foo/foo-broker.ts';

// A quest fixture's review history. Spread into `planningNotes` explicitly at each site rather than
// hidden behind a default, so each quest fixture states its own history.
const REVIEW_LEDGER = [
  QuestBlightLedgerEntryStub({
    itemId: `${BLIGHT_FILE}:craft`,
    workItemId: ITEM_ID,
    createdAt: FIXED_TIMESTAMP,
  }),
];

// The five roles that run a planner/worker/reviewer round, read from the same static the responder
// reads, so a role added there is swept into the 'done' happy-path matrix and the
// commit-before-signal matrix below automatically instead of going untested.
const REVIEWED_ROLES = agentPromptClassificationStatics.operatorRoleNames;

// The two roles outside that list whose session still writes code and therefore still owes a clean
// tree before it signals — the other half of the commit-before-signal matrix.
const NON_REVIEWED_COMMITTING_ROLES = ['spiritmender', 'warpgate'] as const;

type SlotManagerRole = keyof typeof slotManagerStatics;
type PtBudgetRole = Exclude<SlotManagerRole, 'ward' | 'orphanRecovery'>;

// Locked verify-tail roles whose pt chain is bounded by slotManagerStatics.<role>.maxAttempts —
// derived from the statics so a newly budgeted role is swept into the block matrix automatically.
const PT_BUDGET_ROLES = (Object.keys(slotManagerStatics) as readonly SlotManagerRole[]).filter(
  (role): role is PtBudgetRole => 'maxAttempts' in slotManagerStatics[role],
);

// Roles the responder exempts from any pt budget: the maxAttempts ladder returns `undefined` for
// every CHAT role (isChatWorkItemRoleGuard) plus `ward` (whose own retry budget lives on
// `slotManagerStatics.ward.maxRetries`, not `maxAttempts`) — there is no minion-role branch, since
// every minion is parent-summoned and never owns an operation item this ladder runs against.
// Derived from `workItemRoleStatics.chat` so a chat role added there is swept into the matrix
// automatically instead of going quietly untested.
const UNBOUNDED_PT_ROLES = [...workItemRoleStatics.chat, 'ward'] as const;

// Two package names the pt-continuation and blocked-quest fixtures below tag their operation items
// and `packagesAffected` with. Named nowhere in source — any two distinct package names would do.
const UI_PACKAGE = 'ui-app';
const API_PACKAGE = 'api-service';
const PACKAGES_AFFECTED = [
  QuestPackageEntryStub({
    name: UI_PACKAGE,
    location: `./packages/${UI_PACKAGE}`,
    changeType: 'edit',
    packageType: 'frontend-react',
  }),
  QuestPackageEntryStub({
    name: API_PACKAGE,
    location: `./packages/${API_PACKAGE}`,
    changeType: 'edit',
    packageType: 'http-backend',
  }),
];

describe('QuestHandleSignalBackResponder', () => {
  describe('signal failures surface (never silently drop the signal)', () => {
    it('ERROR: {quest unreadable} => throws naming the quest, signal, and work item', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      proxy.setupQuestUnreadable();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: ITEM_ID });

      await expect(
        QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete' }),
      ).rejects.toThrow(
        /signal-back could not load quest add-auth to apply 'complete' to work item a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/u,
      );
    });

    // An id that is not on the quest at all is NOT a redelivery — no legitimate path produces one,
    // and the redelivery case is the already-terminal branch below. Reporting success for it lets an
    // agent end its turn believing it signalled while its REAL work item stays `in_progress` until
    // orphan recovery spends a reset on it, and the agent has no way to detect the mistake. Throw
    // for exactly the reason the unreadable-quest branch throws: the failure must ride back up the
    // awaited signal-back path to the agent instead of vanishing behind a green response.
    it('ERROR: {work item not on quest} => throws naming the quest and work item, persisting nothing', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const quest = QuestStub({
        operations: [OperationItemStub({ id: OP1_ID, status: 'in_progress' })],
        workItems: [],
      });
      proxy.setupQuest({ quest });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: QuestWorkItemIdStub({ value: ITEM_ID }),
          signal: 'complete',
        }),
      ).rejects.toThrow(
        /signal-back: work item a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d is not on quest add-auth/u,
      );

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('idempotent no-ops', () => {
    it("EDGE: {work item already terminal, redelivered 'partial'} => success, no second pt continuation and zero persists", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
          }),
          OperationItemStub({
            id: OP2_ID,
            role: 'codeweaver',
            text: 'pt 2: core: config adapter',
            status: 'pending',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
      });
      proxy.setupQuest({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("EDGE: {linked operation already complete, work item still active, 'partial'} => terminalizes the item in one persist, operations untouched (no continuation)", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const completedOp = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
      });
      const quest = QuestStub({
        operations: [completedOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [completedOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe("operationStatus 'done' (or absent) — one atomic persist, then advance", () => {
    // The terminal work item and its completed operation land in ONE persist, so a crash is
    // all-or-nothing, and NOTHING is appended beside them — the standards review of this commit
    // happened inside the session's own turn, via the reviewer-minion whose disposition the
    // review-coverage gate just read. Advance then mints the next work item for the pending tail.
    it("VALID: {codeweaver 'done', next op pending} => ONE persist completes item+operation and appends NO review item; advance creates the next work item", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const op2Pending = OperationItemStub({
        id: OP2_ID,
        role: 'siegemaster',
        text: 'qa: login flow',
        status: 'pending',
      });
      const quest = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
          }),
          op2Pending,
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const op1Complete = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
      });
      const questAfterOutcome = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [op1Complete, op2Pending],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([
        questAfterOutcome,
        QuestStub({
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            op1Complete,
            OperationItemStub({
              id: OP2_ID,
              role: 'siegemaster',
              text: 'qa: login flow',
              status: 'in_progress',
            }),
          ],
          workItems: [
            completedItem,
            WorkItemStub({
              id: ADVANCE_UUID,
              role: 'siegemaster',
              status: 'pending',
              relatedDataItems: [`operations/${OP2_ID}`],
              dependsOn: [itemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        }),
      ]);
    });

    // The regression guard for the deleted relay role: a completing committing session mints NO
    // extra operation item and NO extra work item of any role. `ward` earns none either — it is a
    // command run that writes no code — so the two cases together pin the whole append surface as
    // empty.
    it.each(REVIEWED_ROLES)(
      "VALID: {%s item, 'done'} => the ledger gains no review operation item and the work-item list gains nothing",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const quest = QuestStub({
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            OperationItemStub({ id: OP1_ID, role, text: 'round one', status: 'in_progress' }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          status: 'complete',
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            OperationItemStub({ id: OP1_ID, role, text: 'round one', status: 'complete' }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'complete',
              relatedDataItems: [`operations/${OP1_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalFlow({ quest, questAfterOutcome });

        await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        });

        expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
      },
    );

    it("VALID: {ward 'done', ledger drained} => the work item terminates and nothing is appended, because a command run commits nothing", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'in_progress',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'complete',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });

    it('VALID: {operationStatus absent, last op} => operation completed in the same persist, ledger drained derives quest complete', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'warpgate',
            text: 'merge: land the quest branch',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'warpgate',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'warpgate',
            text: 'merge: land the quest branch',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'warpgate',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  // §4.3 of the post-mortem measured a session dying ONE gate short of its commit while holding a
  // fully verified, twice-green artifact: the re-carve destroyed it, 101 minutes of wall clock for
  // 11 minutes of work, with no trace in quest.json that any of it happened. The check is "is the
  // tree clean", never "did you make a commit".
  describe('commit-before-signal gate — a code-changing role is refused while its worktree is dirty', () => {
    it.each([...REVIEWED_ROLES, ...NON_REVIEWED_COMMITTING_ROLES])(
      "ERROR: {%s item, tracked modification uncommitted, 'done'} => refused, and the message names the dirty path",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        proxy.setupQuest({
          quest: QuestStub({
            planningNotes: { blightLedger: REVIEW_LEDGER },
            operations: [
              OperationItemStub({ id: OP1_ID, role, text: 'round one', status: 'in_progress' }),
            ],
            workItems: [
              WorkItemStub({
                id: itemId,
                role,
                status: 'in_progress',
                relatedDataItems: [`operations/${OP1_ID}`],
              }),
            ],
          }),
        });
        proxy.setupWorktree({ trackedFiles: [BLIGHT_FILE], untrackedFiles: [] });

        await expect(
          QuestHandleSignalBackResponder({
            questId: QuestIdStub({ value: 'add-auth' }),
            workItemId: itemId,
            signal: 'complete',
            operationStatus: 'done',
          }),
        ).rejects.toThrow(
          new RegExp(
            `signal-back refused: the quest worktree still carries 1 uncommitted change\\(s\\).*- ${BLIGHT_FILE}.*Commit this round`,
            'su',
          ),
        );
      },
    );

    // The case a bare `git diff` misses entirely: every net-new file a worker just wrote is
    // untracked, so a gate reading the tracked half alone comes back clean on the dirtiest tree.
    it("ERROR: {codeweaver item, ONLY untracked additions, 'done'} => refused naming the untracked path", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'codeweaver',
              text: 'core: config adapter',
              status: 'in_progress',
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'codeweaver',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [BLIGHT_FILE] });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        new RegExp(
          `signal-back refused: the quest worktree still carries 1 uncommitted change\\(s\\).*- ${BLIGHT_FILE}`,
          'su',
        ),
      );
    });

    // A blocked quest hands its work forward through git exactly as a finished one does, so the
    // outcome that halts is the one that most needs the work durable first.
    it("ERROR: {codeweaver item, dirty tree, 'blocked'} => refused too, and nothing is persisted", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'codeweaver',
              text: 'core: config adapter',
              status: 'in_progress',
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'codeweaver',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });
      proxy.setupWorktree({ trackedFiles: [BLIGHT_FILE], untrackedFiles: [] });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'blocked',
          blockedReason: BlockedReasonStub({
            value: 'the CI token this round needs is not on this machine',
          }),
        }),
      ).rejects.toThrow(
        /signal-back refused: the quest worktree still carries 1 uncommitted change/u,
      );

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("VALID: {codeweaver item, clean worktree, 'done'} => accepted, and the git read ran inside the WORKTREE", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getGitSpawnedArgsList()).toStrictEqual([
        ['diff', 'HEAD', '--name-only'],
        ['ls-files', '--others', '--exclude-standard'],
      ]);
    });

    // A hydrated quest, or one seeded before worktrees, resolves to the repo root rather than a
    // worktree of its own. That is a real state, not a violation — so the gate skips entirely and
    // never reaches git, which is what the empty spawn list proves.
    it("VALID: {codeweaver item, quest with no resolvable worktree, 'done'} => accepted with no git command run at all", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getGitSpawnedArgsList()).toStrictEqual([]);
    });

    // Ward and riftcarver never call signal-back at all, and a chat role commits nothing — so
    // neither pays the git cost, which the empty spawn list is what proves.
    it("VALID: {ward item, dirty worktree staged, 'done'} => accepted, because a COMMAND role is outside the gate and never reaches git", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'in_progress',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'complete',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupWorktree({ trackedFiles: [BLIGHT_FILE], untrackedFiles: [] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getGitSpawnedArgsList()).toStrictEqual([]);
    });
  });

  describe("operationStatus 'partial' — pt continuation duplicated after the completed item", () => {
    it("VALID: {unlocked codeweaver, first 'partial'} => same persist completes the item and appends 'pt 2: <base>' directly after it", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
            locked: false,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const op1Complete = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
        locked: false,
      });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'codeweaver',
        text: 'pt 2: core: config adapter',
        status: 'pending',
        locked: false,
      });
      const questAfterOutcome = QuestStub({
        operations: [op1Complete, continuation],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
    });

    it("VALID: {whole-quest flowrider item, 'partial'} => continuation carries the same flowIds so the fresh session keeps every flow", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const flowText = 'Flowrider: author the flow-perspective test suites across every quest flow';
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'flowrider',
            text: flowText,
            status: 'in_progress',
            locked: true,
            flowIds: ['send-comment', 'view-comments'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'flowrider',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const op1Complete = OperationItemStub({
        id: OP1_ID,
        role: 'flowrider',
        text: flowText,
        status: 'complete',
        locked: true,
        flowIds: ['send-comment', 'view-comments'],
      });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'flowrider',
        text: `pt 2: ${flowText}`,
        status: 'pending',
        locked: true,
        flowIds: ['send-comment', 'view-comments'],
      });
      const questAfterOutcome = QuestStub({
        operations: [op1Complete, continuation],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
        continuation,
      ]);
    });

    it("VALID: {package-sliced codeweaver item, 'partial'} => continuation carries the same packageNames so the fresh session keeps its slice instead of working the whole quest", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const sliceText = 'ui-app: comment composer widget + binding';
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: sliceText,
            status: 'in_progress',
            locked: false,
            packageNames: [UI_PACKAGE, API_PACKAGE],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const op1Complete = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: sliceText,
        status: 'complete',
        locked: false,
        packageNames: [UI_PACKAGE, API_PACKAGE],
      });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'codeweaver',
        text: `pt 2: ${sliceText}`,
        status: 'pending',
        locked: false,
        packageNames: [UI_PACKAGE, API_PACKAGE],
      });
      const questAfterOutcome = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [op1Complete, continuation],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
        continuation,
      ]);
    });

    it("VALID: {'partial' on a 'pt 2: <base>' item} => continuation is 'pt 3: <base>' inserted right after it", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const original = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
      });
      const quest = QuestStub({
        operations: [
          original,
          OperationItemStub({
            id: OP2_ID,
            role: 'codeweaver',
            text: 'pt 2: core: config adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP2_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          original,
          OperationItemStub({
            id: OP2_ID,
            role: 'codeweaver',
            text: 'pt 2: core: config adapter',
            status: 'complete',
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'codeweaver',
            text: 'pt 3: core: config adapter',
            status: 'pending',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP2_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
    });

    it("VALID: {locked ward item with wardMode: 'changed'} => continuation preserves locked AND wardMode", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'in_progress',
            locked: true,
            wardMode: 'changed',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'changed',
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'complete',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'ward',
            text: 'pt 2: Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'changed',
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

      await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
    });

    it("VALID: {UNLOCKED codeweaver at chainLength >= maxAttempts} => continuation still appended ('pt 4'), the budget applies to locked items only", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      // Chain of slotManagerStatics.codeweaver.maxAttempts (3) same-base items, none locked.
      const chainOriginal = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
        locked: false,
      });
      const chainPt2 = OperationItemStub({
        id: OP2_ID,
        role: 'codeweaver',
        text: 'pt 2: core: config adapter',
        status: 'complete',
        locked: false,
      });
      const chainPt3 = OperationItemStub({
        id: OP3_ID,
        role: 'codeweaver',
        text: 'pt 3: core: config adapter',
        status: 'in_progress',
        locked: false,
      });
      const quest = QuestStub({
        operations: [chainOriginal, chainPt2, chainPt3],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP3_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          chainOriginal,
          chainPt2,
          OperationItemStub({
            id: OP3_ID,
            role: 'codeweaver',
            text: 'pt 3: core: config adapter',
            status: 'complete',
            locked: false,
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'codeweaver',
            text: 'pt 4: core: config adapter',
            status: 'pending',
            locked: false,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP3_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
    });

    it.each(UNBOUNDED_PT_ROLES)(
      "VALID: {role: %s, LOCKED chain of 3, 'partial'} => budget-exempt role still appends 'pt 4'",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const chainOriginal = OperationItemStub({
          id: OP1_ID,
          role,
          text: 'verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt2 = OperationItemStub({
          id: OP2_ID,
          role,
          text: 'pt 2: verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt3 = OperationItemStub({
          id: OP3_ID,
          role,
          text: 'pt 3: verify: quest flows',
          status: 'in_progress',
          locked: true,
        });
        const quest = QuestStub({
          operations: [chainOriginal, chainPt2, chainPt3],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'in_progress',
              relatedDataItems: [`operations/${OP3_ID}`],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          operations: [
            chainOriginal,
            chainPt2,
            OperationItemStub({
              id: OP3_ID,
              role,
              text: 'pt 3: verify: quest flows',
              status: 'complete',
              locked: true,
            }),
            OperationItemStub({
              id: CONTINUATION_UUID,
              role,
              text: 'pt 4: verify: quest flows',
              status: 'pending',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'complete',
              relatedDataItems: [`operations/${OP3_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalFlow({ quest, questAfterOutcome });
        proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

        const result = await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'partial',
        });

        expect(result).toStrictEqual({ success: true });
        expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
      },
    );
  });

  describe('explicit operationItemId parameter', () => {
    it("VALID: {operationItemId set, work item linked to a different op} => the explicit id wins; the work item's own ref stays untouched", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const linkedOp = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'in_progress',
      });
      const quest = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          linkedOp,
          OperationItemStub({
            id: OP2_ID,
            role: 'siegemaster',
            text: 'qa: login flow',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'siegemaster',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          linkedOp,
          OperationItemStub({
            id: OP2_ID,
            role: 'siegemaster',
            text: 'qa: login flow',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'siegemaster',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationItemId: OperationItemIdStub({ value: OP2_ID }),
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe('work item without an operations ref', () => {
    it('EDGE: {relatedDataItems: []} => just terminalizes the work item, still success', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'chaoswhisperer',
            status: 'in_progress',
            relatedDataItems: [],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'chaoswhisperer',
            status: 'complete',
            relatedDataItems: [],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe("operationStatus 'blocked' — environment wall halts the quest with the reason recorded", () => {
    it("VALID: {operationStatus: 'blocked', blockedReason} => work item failed carrying the reason, continuation appended, quest blocked, pending items skipped", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const pendingId = QuestWorkItemIdStub({ value: PENDING_ITEM_ID });
      const blockedReason = BlockedReasonStub({
        value: 'git commit is denied in this dispatched session',
      });
      const flowriderOp = OperationItemStub({
        id: OP1_ID,
        role: 'flowrider',
        text: 'Flowrider: author the test suites that prove the login flow',
        status: 'in_progress',
        locked: true,
      });
      const quest = QuestStub({
        operations: [
          flowriderOp,
          OperationItemStub({ id: OP2_ID, role: 'ward', text: 'Ward gate', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
          WorkItemStub({ id: pendingId, role: 'ward', status: 'pending', dependsOn: [itemId] }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove the login flow',
            status: 'complete',
            locked: true,
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'flowrider',
            text: 'pt 2: Flowrider: author the test suites that prove the login flow',
            status: 'pending',
            locked: true,
          }),
          OperationItemStub({ id: OP2_ID, role: 'ward', text: 'Ward gate', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'failed',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
            errorMessage: 'git commit is denied in this dispatched session',
          }),
          WorkItemStub({ id: pendingId, role: 'ward', status: 'pending', dependsOn: [itemId] }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalBlocked({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'blocked',
        blockedReason,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);

      const finalQuest = proxy.getLastPersistedQuest();

      expect({
        persistedStatuses: proxy.getAllPersistedQuests().map(({ status }) => status),
        finalWorkItems: finalQuest.workItems.map(({ id, status, errorMessage }) => ({
          id,
          status,
          errorMessage,
        })),
        finalOperations: finalQuest.operations.map(({ text, status }) => ({
          text: String(text),
          status,
        })),
      }).toStrictEqual({
        persistedStatuses: ['in_progress', 'blocked'],
        finalWorkItems: [
          {
            id: itemId,
            status: 'failed',
            errorMessage: 'git commit is denied in this dispatched session',
          },
          { id: pendingId, status: 'skipped', errorMessage: undefined },
        ],
        finalOperations: [
          {
            text: 'Flowrider: author the test suites that prove the login flow',
            status: 'complete',
          },
          {
            text: 'pt 2: Flowrider: author the test suites that prove the login flow',
            status: 'pending',
          },
          { text: 'Ward gate', status: 'pending' },
        ],
      });
    });

    it("VALID: {package-sliced codeweaver item, 'blocked'} => the wall's continuation keeps both flowIds and packageNames, so the resume re-dispatches this slice and not the whole quest", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const blockedReason = BlockedReasonStub({
        value: 'the database migration tool is not installed in this environment',
      });
      const sliceText = 'Codeweaver: build this slice — package: ui-app';
      const sliceOp = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: sliceText,
        status: 'in_progress',
        locked: false,
        flowIds: ['login-flow'],
        packageNames: [UI_PACKAGE],
      });
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [sliceOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const op1Complete = OperationItemStub({ ...sliceOp, status: 'complete' });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'codeweaver',
        text: `pt 2: ${sliceText}`,
        status: 'pending',
        locked: false,
        flowIds: ['login-flow'],
        packageNames: [UI_PACKAGE],
      });
      const questAfterOutcome = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [op1Complete, continuation],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'failed',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
            errorMessage: 'the database migration tool is not installed in this environment',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalBlocked({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'blocked',
        blockedReason,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
        continuation,
      ]);
    });

    it.each(PT_BUDGET_ROLES)(
      "VALID: {role: %s, LOCKED chain at maxAttempts, 'blocked'} => the pt budget does NOT gate a wall — 'pt 4' is still appended so a resume re-dispatches this scope",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const chainOriginal = OperationItemStub({
          id: OP1_ID,
          role,
          text: 'verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt2 = OperationItemStub({
          id: OP2_ID,
          role,
          text: 'pt 2: verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt3 = OperationItemStub({
          id: OP3_ID,
          role,
          text: 'pt 3: verify: quest flows',
          status: 'in_progress',
          locked: true,
        });
        const quest = QuestStub({
          operations: [chainOriginal, chainPt2, chainPt3],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'in_progress',
              relatedDataItems: [`operations/${OP3_ID}`],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          operations: [
            chainOriginal,
            chainPt2,
            OperationItemStub({
              id: OP3_ID,
              role,
              text: 'pt 3: verify: quest flows',
              status: 'complete',
              locked: true,
            }),
            OperationItemStub({
              id: CONTINUATION_UUID,
              role,
              text: 'pt 4: verify: quest flows',
              status: 'pending',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'failed',
              relatedDataItems: [`operations/${OP3_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
              errorMessage: 'the dev server port is already bound by another process',
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalBlocked({ quest, questAfterOutcome });
        proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

        const result = await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'blocked',
          blockedReason: BlockedReasonStub({
            value: 'the dev server port is already bound by another process',
          }),
        });

        expect(result).toStrictEqual({ success: true });
        expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
        expect(proxy.getAllPersistedQuests().map(({ status }) => status)).toStrictEqual([
          'in_progress',
          'blocked',
        ]);
      },
    );
  });

  describe('locked pt-chain budget spent — quest blocks instead of appending', () => {
    it.each(PT_BUDGET_ROLES)(
      "VALID: {role: %s, LOCKED chain at maxAttempts, 'partial'} => no continuation, quest blocked and pending items skipped",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const pendingId = QuestWorkItemIdStub({ value: PENDING_ITEM_ID });
        // Chain length == slotManagerStatics.<role>.maxAttempts (3): the budget is spent.
        const chainOriginal = OperationItemStub({
          id: OP1_ID,
          role,
          text: 'verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt2 = OperationItemStub({
          id: OP2_ID,
          role,
          text: 'pt 2: verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt3 = OperationItemStub({
          id: OP3_ID,
          role,
          text: 'pt 3: verify: quest flows',
          status: 'in_progress',
          locked: true,
        });
        const quest = QuestStub({
          operations: [chainOriginal, chainPt2, chainPt3],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'in_progress',
              relatedDataItems: [`operations/${OP3_ID}`],
            }),
            WorkItemStub({
              id: pendingId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [itemId],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          operations: [
            chainOriginal,
            chainPt2,
            OperationItemStub({
              id: OP3_ID,
              role,
              text: 'pt 3: verify: quest flows',
              status: 'complete',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'complete',
              relatedDataItems: [`operations/${OP3_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
            }),
            WorkItemStub({
              id: pendingId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [itemId],
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalBlocked({ quest, questAfterOutcome });

        const result = await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'partial',
        });

        expect(result).toStrictEqual({ success: true });
        // Persist 1 (the responder's own atomic outcome write) completes the chain WITHOUT a
        // 'pt 4' continuation — a spent budget halts the quest exactly as an environment wall does.
        expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);

        const finalQuest = proxy.getLastPersistedQuest();

        // The carrier goes `failed` and carries the REASON. It used to be left `complete`, which
        // made this the one halt route with nothing to read: every row green, quest `blocked`, and
        // no `errorMessage` anywhere naming the spent chain. The environment-wall route has always
        // written its `blockedReason` onto the item for exactly this purpose, and the execution row
        // renders that field — so without it the user is told `blocked` and nothing else.
        expect({
          persistedStatuses: proxy.getAllPersistedQuests().map(({ status }) => status),
          finalWorkItems: finalQuest.workItems.map(({ id, status }) => ({ id, status })),
          carrierErrorMessages: finalQuest.workItems.map(({ errorMessage }) =>
            String(errorMessage),
          ),
          finalOperationTexts: finalQuest.operations.map(({ text }) => String(text)),
        }).toStrictEqual({
          persistedStatuses: ['in_progress', 'blocked'],
          finalWorkItems: [
            { id: itemId, status: 'failed' },
            { id: pendingId, status: 'skipped' },
          ],
          carrierErrorMessages: [
            `${role} pt chain for "verify: quest flows" is spent: 3 attempt(s) signalled 'partial' against a budget of 3. The remaining scope is on the last 'pt' operation item; a resume re-dispatches it.`,
            'undefined',
          ],
          finalOperationTexts: [
            'verify: quest flows',
            'pt 2: verify: quest flows',
            'pt 3: verify: quest flows',
          ],
        });
      },
    );
  });
});
