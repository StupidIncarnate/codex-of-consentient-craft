import {
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RiftcarverResultStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questRunRiftcarverBroker } from './quest-run-riftcarver-broker';
import { questRunRiftcarverBrokerProxy } from './quest-run-riftcarver-broker.proxy';

// The proxy pins crypto.randomUUID to a deterministic sequence: call #0 = riftcarverResultId, then
// every later call (spiritmender op id, fresh-carve op id, advance's new work-item id) gets the next
// sequenced UUID.
const RIFTCARVER_RESULT_ID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
const SECOND_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f001';
const THIRD_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f002';
const FOURTH_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f003';
const FIFTH_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f004';

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

// Virtual-fs + virtual-git constants baked into the proxy.
const GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const QUEST_FOLDER_PATH = `/home/testuser/.dungeonmaster/guilds/${GUILD_ID}/quests/001-add-auth`;
const BRANCH_NAME = 'quest/add-authentication-add-auth';
const WORKTREE_PATH = '/repo/worktrees/add-authentication-add-auth';
const PACKAGE_WORKTREE_PATH = `${WORKTREE_PATH}/packages/shared`;
const HEAD_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

const CARVE_OP_ID = '11111111-1111-4111-8111-111111111111';
const CODEWEAVER_OP_ID = '22222222-2222-4222-8222-222222222222';
const CARVE_WORK_ITEM_ID = 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5';
const FIRST_CARVE_WORK_ITEM_ID = 'b2b2b2b2-c3c3-d4d4-e5e5-f6f6f6f6f6f6';
const SECOND_CARVE_OP_ID = '33333333-3333-4333-8333-333333333333';
const PENDING_WORK_ITEM_ID = 'c3c3c3c3-d4d4-e5e5-f6f6-a7a7a7a7a7a7';

const CARVE_TEXT = 'Riftcarver: carve the quest branch, worktree and preflight build';
// Deliberately NOT the sha the virtual git world reports for HEAD: a test that seeds the same value
// on both sides cannot tell "kept the record" apart from "recomputed and got lucky".
const RECORDED_BASE_REF = 'c0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ff';

describe('questRunRiftcarverBroker', () => {
  describe('GREEN — a first carve on a quest with no git context', () => {
    it('VALID: {no branch, no worktree, build passes} => carves, pins baseRef, completes both items and advances to the codeweaver', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const codeweaverOp = OperationItemStub({
        id: CODEWEAVER_OP_ID,
        role: 'codeweaver',
        text: 'shared: contracts',
        status: 'pending',
      });
      const carveItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [`operations/${CARVE_OP_ID}`],
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [carveOp, codeweaverOp],
          workItems: [carveItem],
        }),
      });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 0,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'green',
      });
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'in_progress',
          updatedAt: FIXED_TIMESTAMP,
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: HEAD_SHA,
          operations: [
            OperationItemStub({ ...carveOp, status: 'complete' }),
            OperationItemStub({ ...codeweaverOp, status: 'in_progress' }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'complete',
              startedAt: FIXED_TIMESTAMP,
              completedAt: FIXED_TIMESTAMP,
              spawnerType: 'command',
              relatedDataItems: [
                `operations/${CARVE_OP_ID}`,
                `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
              ],
            }),
            WorkItemStub({
              id: SECOND_UUID,
              role: 'codeweaver',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
              dependsOn: [workItemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          riftcarverResults: [
            RiftcarverResultStub({
              id: RIFTCARVER_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 0,
              outcome: 'green',
            }),
          ],
        }),
      );
    });

    it('VALID: {carve runs} => streams every step banner and the build output to onLine, in order', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const lines: unknown[] = [];
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });

      await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: (line: string) => {
          lines.push(line);
        },
      });

      expect(lines).toStrictEqual([
        '— base branch: main —',
        `— git worktree add ${WORKTREE_PATH} (branch ${BRANCH_NAME}) —`,
        `— baseRef ${HEAD_SHA} —`,
        `— git push -u origin ${BRANCH_NAME} —`,
        `— mirroring node_modules: ${WORKTREE_PATH} —`,
        `— mirroring node_modules: ${PACKAGE_WORKTREE_PATH} —`,
        '— build pass 1/3 —',
        'Build succeeded',
        '— build green on pass 1/3 —',
        `— CARVED: ${BRANCH_NAME} at ${HEAD_SHA} —`,
      ]);
    });

    it('VALID: {carve runs} => the work item is stamped in_progress BEFORE the carve, not left pending for minutes', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });

      await questRunRiftcarverBroker({ questId, workItemId, onLine: () => undefined });

      expect(proxy.getPersistedWorkItemStatusesInWriteOrder({ workItemId })).toStrictEqual([
        'in_progress',
        'complete',
      ]);
    });

    it('VALID: {carve runs} => the accumulated stream is persisted verbatim to riftcarver-results/<id>.log', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });

      await questRunRiftcarverBroker({ questId, workItemId, onLine: () => undefined });

      expect(proxy.getRiftcarverLogWrites()).toStrictEqual([
        {
          path: `${QUEST_FOLDER_PATH}/riftcarver-results/${RIFTCARVER_RESULT_ID}.log`,
          contents: [
            '— base branch: main —',
            `— git worktree add ${WORKTREE_PATH} (branch ${BRANCH_NAME}) —`,
            `— baseRef ${HEAD_SHA} —`,
            `— git push -u origin ${BRANCH_NAME} —`,
            `— mirroring node_modules: ${WORKTREE_PATH} —`,
            `— mirroring node_modules: ${PACKAGE_WORKTREE_PATH} —`,
            '— build pass 1/3 —',
            'Build succeeded',
            '— build green on pass 1/3 —',
            `— CARVED: ${BRANCH_NAME} at ${HEAD_SHA} —`,
          ].join('\n'),
        },
      ]);
    });
  });

  describe('REPAIRABLE — the build goes red with budget left', () => {
    it('VALID: {build fails, first attempt} => carve item failed, op complete, spiritmender + pt 2 riftcarver spliced, spiritmender dispatched', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const codeweaverOp = OperationItemStub({
        id: CODEWEAVER_OP_ID,
        role: 'codeweaver',
        text: 'shared: contracts',
        status: 'pending',
      });
      const carveItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [`operations/${CARVE_OP_ID}`],
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [carveOp, codeweaverOp],
          workItems: [carveItem],
        }),
      });
      proxy.setupBuildFails({ lines: ['error TS2304: Cannot find name x'] });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'repairable',
        failedStep: 'build',
      });
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'in_progress',
          updatedAt: FIXED_TIMESTAMP,
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: HEAD_SHA,
          operations: [
            OperationItemStub({ ...carveOp, status: 'complete' }),
            OperationItemStub({
              id: SECOND_UUID,
              role: 'spiritmender',
              text: `Spiritmender: fix riftcarver build failure — riftcarverResult ${RIFTCARVER_RESULT_ID}`,
              status: 'in_progress',
              locked: true,
            }),
            OperationItemStub({
              id: THIRD_UUID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'pending',
              locked: true,
            }),
            codeweaverOp,
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'failed',
              startedAt: FIXED_TIMESTAMP,
              completedAt: FIXED_TIMESTAMP,
              spawnerType: 'command',
              relatedDataItems: [
                `operations/${CARVE_OP_ID}`,
                `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
              ],
              errorMessage: 'riftcarver_build_failed',
            }),
            WorkItemStub({
              id: FOURTH_UUID,
              role: 'spiritmender',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${SECOND_UUID}`],
              dependsOn: [workItemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          riftcarverResults: [
            RiftcarverResultStub({
              id: RIFTCARVER_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              failedStep: 'build',
              outcome: 'repairable',
            }),
          ],
        }),
      );
    });
  });

  describe('base branch resolution', () => {
    // gitDetectBaseBranchBroker probes main then master. Every other case in this file resolves on
    // the first candidate, so without this one a broker hardcoding 'main' would stay green.
    it('VALID: {no local main, master present} => forks the worktree from master and records it as the quest’s base branch', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const lines: unknown[] = [];
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupBaseBranchMasterOnly();

      await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: (line: string) => {
          lines.push(line);
        },
      });

      // The base branch is the LAST argv slot: the commit the new branch is cut from.
      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([
        ['worktree', 'add', WORKTREE_PATH, '-b', BRANCH_NAME, 'master'],
      ]);
      expect(proxy.getPersistedQuest().baseBranch).toBe('master');
      expect(lines).toStrictEqual([
        '— base branch: master —',
        `— git worktree add ${WORKTREE_PATH} (branch ${BRANCH_NAME}) —`,
        `— baseRef ${HEAD_SHA} —`,
        `— git push -u origin ${BRANCH_NAME} —`,
        `— mirroring node_modules: ${WORKTREE_PATH} —`,
        `— mirroring node_modules: ${PACKAGE_WORKTREE_PATH} —`,
        '— build pass 1/3 —',
        'Build succeeded',
        '— build green on pass 1/3 —',
        `— CARVED: ${BRANCH_NAME} at ${HEAD_SHA} —`,
      ]);
    });
  });

  describe('build command resolution', () => {
    // Without this case only the ConfigNotFoundError fallback is ever exercised, so a broker that
    // ignored the resolved config entirely would stay green.
    it('VALID: {.dungeonmaster.json declares devServer.buildCommand} => that command is what reaches the spawn, not the default', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupConfiguredBuildCommand({ buildCommand: 'pnpm run compile' });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(proxy.getBuildSpawns()).toStrictEqual([
        { command: 'pnpm', args: ['run', 'compile'], cwd: WORKTREE_PATH },
      ]);
      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 0,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'green',
      });
    });
  });

  describe('PUSH — the step that makes every later push a bare one', () => {
    // Pushing at CARVE time is what removes the branching decision from every session downstream:
    // the branch is tracked before the first round runs, so every `<role>-reviewer-minion` prompt
    // writes a bare `git push` and no session ever has to decide about `-u`.
    it('VALID: {fresh carve, branch tracks nothing} => pushes with -u so the branch is tracked from the start', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const lines: unknown[] = [];
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });

      await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: (line: string) => {
          lines.push(line);
        },
      });

      expect(lines.filter((line) => String(line).includes('push'))).toStrictEqual([
        `— git push -u origin ${BRANCH_NAME} —`,
      ]);
    });

    // REPAIRABLE, not blocked: the worktree is fully built and holds every commit, so a spiritmender
    // has somewhere to work and the pt N retries only the publication. Blocking here would halt a
    // quest over a network blip.
    it('VALID: {push fails} => routes repairable naming the push step, so the quest keeps running', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const carveItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [`operations/${CARVE_OP_ID}`],
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [carveOp],
          workItems: [carveItem],
        }),
      });
      proxy.setupPushFails({ output: 'fatal: unable to access remote: Could not resolve host' });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'repairable',
        failedStep: 'push',
      });
    });
  });

  describe('REPAIRABLE — the node_modules mirror goes red', () => {
    // The mirror's own repairable route. The only other node_modules failure in this file is EACCES,
    // which the permission guard deliberately diverts to `blocked` — so without this case
    // `classifications['node_modules'] === 'repairable'` is never actually exercised, and a
    // spiritmender spliced from the MIRROR rather than the build has no coverage at all.
    it('VALID: {mirror fails for a non-permission reason} => spiritmender naming node_modules + pt 2 riftcarver spliced, quest keeps running', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const carveItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [`operations/${CARVE_OP_ID}`],
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [carveOp],
          workItems: [carveItem],
        }),
      });
      proxy.setupNodeModulesMirrorFails({
        error: new Error(`ENOSPC: no space left on device, mkdir '${WORKTREE_PATH}/node_modules'`),
      });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'repairable',
        failedStep: 'node_modules',
      });
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'in_progress',
          updatedAt: FIXED_TIMESTAMP,
          // The git context landed BEFORE the mirror ran, which is what gives the spiritmender a
          // worktree to work in at all.
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: HEAD_SHA,
          operations: [
            OperationItemStub({ ...carveOp, status: 'complete' }),
            OperationItemStub({
              id: SECOND_UUID,
              role: 'spiritmender',
              text: `Spiritmender: fix riftcarver node_modules failure — riftcarverResult ${RIFTCARVER_RESULT_ID}`,
              status: 'in_progress',
              locked: true,
            }),
            OperationItemStub({
              id: THIRD_UUID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'pending',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'failed',
              startedAt: FIXED_TIMESTAMP,
              completedAt: FIXED_TIMESTAMP,
              spawnerType: 'command',
              relatedDataItems: [
                `operations/${CARVE_OP_ID}`,
                `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
              ],
              errorMessage: 'riftcarver_node_modules_failed',
            }),
            WorkItemStub({
              id: FOURTH_UUID,
              role: 'spiritmender',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${SECOND_UUID}`],
              dependsOn: [workItemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          riftcarverResults: [
            RiftcarverResultStub({
              id: RIFTCARVER_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              failedStep: 'node_modules',
              outcome: 'repairable',
            }),
          ],
        }),
      );
    });
  });

  describe('REPAIRABLE — the repair budget is spent', () => {
    it('VALID: {build fails, maxRetries carve operations since the last green} => no spiritmender appended, quest blocked, pending items skipped', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const priorRedOps = Array.from(
        { length: slotManagerStatics.riftcarver.maxRetries - 1 },
        (_, index) =>
          OperationItemStub({
            id: `cccccccc-0000-4000-8000-00000000000${index}`,
            role: 'riftcarver',
            text: CARVE_TEXT,
            status: 'complete',
            locked: true,
          }),
      );
      const priorRedItems = priorRedOps.map((operation, index) =>
        WorkItemStub({
          id: `dddddddd-0000-4000-8000-00000000000${index}`,
          role: 'riftcarver',
          status: 'failed',
          spawnerType: 'command',
          relatedDataItems: [`operations/${String(operation.id)}`],
        }),
      );
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const codeweaverOp = OperationItemStub({
        id: CODEWEAVER_OP_ID,
        role: 'codeweaver',
        text: 'shared: contracts',
        status: 'pending',
      });
      const carveItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [`operations/${CARVE_OP_ID}`],
      });
      const pendingItem = WorkItemStub({
        id: PENDING_WORK_ITEM_ID,
        role: 'codeweaver',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [`operations/${CODEWEAVER_OP_ID}`],
        dependsOn: [workItemId],
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [...priorRedOps, carveOp, codeweaverOp],
          workItems: [...priorRedItems, carveItem, pendingItem],
        }),
      });
      proxy.setupBuildFails({ lines: ['error TS2304: Cannot find name x'] });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'blocked',
        failedStep: 'build',
      });
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'blocked',
          updatedAt: FIXED_TIMESTAMP,
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: HEAD_SHA,
          operations: [
            ...priorRedOps,
            OperationItemStub({ ...carveOp, status: 'complete' }),
            codeweaverOp,
          ],
          workItems: [
            ...priorRedItems,
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'failed',
              startedAt: FIXED_TIMESTAMP,
              completedAt: FIXED_TIMESTAMP,
              spawnerType: 'command',
              relatedDataItems: [
                `operations/${CARVE_OP_ID}`,
                `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
              ],
              errorMessage: 'riftcarver_build_failed',
            }),
            WorkItemStub({ ...pendingItem, status: 'skipped' }),
          ],
          riftcarverResults: [
            RiftcarverResultStub({
              id: RIFTCARVER_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              failedStep: 'build',
              outcome: 'blocked',
            }),
          ],
        }),
      );
    });
  });

  describe('GIT-STATE — the quest blocks rather than dispatching an agent into the repo root', () => {
    it('VALID: {no local main or master} => nothing carved, git error verbatim on the failed row, quest blocked', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const carveItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [`operations/${CARVE_OP_ID}`],
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [carveOp],
          workItems: [carveItem],
        }),
      });
      proxy.setupNoBaseBranch();

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'blocked',
        failedStep: 'base_branch',
      });
      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([]);
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'blocked',
          updatedAt: FIXED_TIMESTAMP,
          operations: [OperationItemStub({ ...carveOp, status: 'complete' })],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'failed',
              startedAt: FIXED_TIMESTAMP,
              completedAt: FIXED_TIMESTAMP,
              spawnerType: 'command',
              relatedDataItems: [
                `operations/${CARVE_OP_ID}`,
                `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
              ],
              errorMessage: 'No local main or master branch found',
            }),
          ],
          riftcarverResults: [
            RiftcarverResultStub({
              id: RIFTCARVER_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              failedStep: 'base_branch',
              outcome: 'blocked',
            }),
          ],
        }),
      );
    });

    it('VALID: {branch name already owned by other work, first carve} => refuses before any worktree add and blocks', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupBranchExistsInGit();

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'blocked',
        failedStep: 'create',
      });
      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([]);
      expect(proxy.getPersistedQuest().status).toBe('blocked');
      expect(proxy.getPersistedQuest().workItems).toStrictEqual([
        WorkItemStub({
          id: workItemId,
          role: 'riftcarver',
          status: 'failed',
          startedAt: FIXED_TIMESTAMP,
          completedAt: FIXED_TIMESTAMP,
          spawnerType: 'command',
          relatedDataItems: [
            `operations/${CARVE_OP_ID}`,
            `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
          ],
          errorMessage: `${BRANCH_NAME} already exists — name is in use by other work`,
        }),
      ]);
    });

    // The collision check is an OR over two independent probes. This case is the only one that can
    // fail if the `fsIsAccessibleAdapter` half is dropped: the branch name is free, so the ref probe
    // returns false and ONLY the occupied directory can refuse the carve.
    it('VALID: {branch name free but the worktree DIRECTORY is already occupied, first carve} => refuses before any worktree add and blocks', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupWorktreeDirectoryOccupied();

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'blocked',
        failedStep: 'create',
      });
      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([]);
      expect(proxy.getPersistedQuest().workItems).toStrictEqual([
        WorkItemStub({
          id: workItemId,
          role: 'riftcarver',
          status: 'failed',
          startedAt: FIXED_TIMESTAMP,
          completedAt: FIXED_TIMESTAMP,
          spawnerType: 'command',
          relatedDataItems: [
            `operations/${CARVE_OP_ID}`,
            `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
          ],
          errorMessage: `${BRANCH_NAME} already exists — name is in use by other work`,
        }),
      ]);
    });

    it('VALID: {git worktree add exits non-zero} => the git output rides the failed row and the quest blocks', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupWorktreeAddFails({ output: 'fatal: invalid reference: main' });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'blocked',
        failedStep: 'create',
      });
      expect(proxy.getPersistedQuest().status).toBe('blocked');
      expect(proxy.getPersistedQuest().workItems).toStrictEqual([
        WorkItemStub({
          id: workItemId,
          role: 'riftcarver',
          status: 'failed',
          startedAt: FIXED_TIMESTAMP,
          completedAt: FIXED_TIMESTAMP,
          spawnerType: 'command',
          relatedDataItems: [
            `operations/${CARVE_OP_ID}`,
            `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
          ],
          errorMessage: `Worktree preparation failed at create: ${WORKTREE_PATH}: fatal: invalid reference: main`,
        }),
      ]);
    });
  });

  describe('PERMISSION DENIED — overrides the step’s own classification', () => {
    it('VALID: {node_modules mirror hits EACCES} => a repairable step blocks instead of spawning a spiritmender', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const carveItem = WorkItemStub({
        id: workItemId,
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: [`operations/${CARVE_OP_ID}`],
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [carveOp],
          workItems: [carveItem],
        }),
      });
      proxy.setupNodeModulesMirrorFails({
        error: new Error(`EACCES: permission denied, mkdir '${WORKTREE_PATH}/node_modules'`),
      });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 1,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'blocked',
        failedStep: 'node_modules',
      });
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'blocked',
          updatedAt: FIXED_TIMESTAMP,
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: HEAD_SHA,
          // No spiritmender and no pt 2: an operator's filesystem saying no is not repairable by a
          // fresh session of any role.
          operations: [OperationItemStub({ ...carveOp, status: 'complete' })],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'failed',
              startedAt: FIXED_TIMESTAMP,
              completedAt: FIXED_TIMESTAMP,
              spawnerType: 'command',
              relatedDataItems: [
                `operations/${CARVE_OP_ID}`,
                `riftcarverResults/${RIFTCARVER_RESULT_ID}`,
              ],
              errorMessage: `EACCES: permission denied, mkdir '${WORKTREE_PATH}/node_modules'`,
            }),
          ],
          riftcarverResults: [
            RiftcarverResultStub({
              id: RIFTCARVER_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              failedStep: 'node_modules',
              outcome: 'blocked',
            }),
          ],
        }),
      );
    });
  });

  // The spiritmender loop re-enters this broker against a partially built workspace as a matter of
  // routine. Every case below asserts the ABSENCE of work that the previous attempt already did —
  // a spawn that did not happen, a symlink that was not written — because a done-check that quietly
  // disappears is invisible to any assertion made only on the final quest state.
  describe('IDEMPOTENCY — a pt N carve against a workspace the first attempt already built', () => {
    it('VALID: {branch + worktree recorded, directory live on the recorded branch} => zero worktree adds, zero collision probes, zero HEAD reads', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const lines: unknown[] = [];
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: RECORDED_BASE_REF,
          operations: [
            OperationItemStub({
              id: CARVE_OP_ID,
              role: 'riftcarver',
              text: CARVE_TEXT,
              status: 'complete',
              locked: true,
            }),
            OperationItemStub({
              id: SECOND_CARVE_OP_ID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: FIRST_CARVE_WORK_ITEM_ID,
              role: 'riftcarver',
              status: 'failed',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${SECOND_CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupExistingWorktree();
      proxy.setupAlreadyPushed();

      await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: (line: string) => {
          lines.push(line);
        },
      });

      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([]);
      expect(proxy.getBranchCollisionProbes()).toStrictEqual([]);
      expect(proxy.getHeadShaSpawns()).toStrictEqual([]);
      expect(lines).toStrictEqual([
        '— skip base branch: main already recorded and still resolves —',
        `— skip worktree: ${WORKTREE_PATH} is already a live worktree of ${BRANCH_NAME} —`,
        `— skip baseRef: already pinned at ${RECORDED_BASE_REF} —`,
        `— skip push: ${BRANCH_NAME} already tracks an upstream —`,
        `— mirroring node_modules: ${WORKTREE_PATH} —`,
        `— mirroring node_modules: ${PACKAGE_WORKTREE_PATH} —`,
        '— build pass 1/3 —',
        'Build succeeded',
        '— build green on pass 1/3 —',
        `— CARVED: ${BRANCH_NAME} at ${RECORDED_BASE_REF} —`,
      ]);
      expect(proxy.getPersistedQuest().baseRef).toBe(RECORDED_BASE_REF);
    });

    it('VALID: {branch + worktree recorded but the directory is GONE} => re-creates the worktree instead of blocking, and still keeps the recorded baseRef', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: RECORDED_BASE_REF,
          operations: [
            OperationItemStub({
              id: SECOND_CARVE_OP_ID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${SECOND_CARVE_OP_ID}`],
            }),
          ],
        }),
      });

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 0,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'green',
      });
      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([
        ['worktree', 'add', WORKTREE_PATH, '-b', BRANCH_NAME, 'main'],
      ]);
      // The recreated worktree's own HEAD reads back as HEAD_SHA, and the quest keeps
      // RECORDED_BASE_REF anyway — the fork point is written exactly once, ever.
      expect(proxy.getPersistedQuest().baseRef).toBe(RECORDED_BASE_REF);
      expect(proxy.getPersistedQuest().status).toBe('complete');
    });

    it('VALID: {branch + worktree recorded, directory GONE, branch STILL in git} => attaches to the existing branch without -b, does not block, still builds, and keeps the recorded baseRef', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: RECORDED_BASE_REF,
          operations: [
            OperationItemStub({
              id: SECOND_CARVE_OP_ID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${SECOND_CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      // The branch the first attempt made is still in git; only its directory is gone. `-b` here
      // refuses with "already exists", which is what used to block the quest forever.
      proxy.setupBranchExistsInGit();

      const result = await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: 0,
        riftcarverResultId: RIFTCARVER_RESULT_ID,
        outcome: 'green',
      });
      // Re-attaching must not move the review base: the recorded fork point survives byte-identical
      // even though the reattached worktree's own HEAD reads back as a different sha.
      expect(proxy.getPersistedQuest().baseRef).toBe(RECORDED_BASE_REF);
      expect(proxy.getPersistedQuest().status).toBe('complete');
    });

    it('VALID: {branch + worktree recorded, directory GONE, branch STILL in git} => prunes the stale registration, adds WITHOUT -b, and still runs the build', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: RECORDED_BASE_REF,
          operations: [
            OperationItemStub({
              id: SECOND_CARVE_OP_ID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${SECOND_CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupBranchExistsInGit();

      await questRunRiftcarverBroker({ questId, workItemId, onLine: () => undefined });

      expect(proxy.getWorktreePruneSpawns()).toStrictEqual([['worktree', 'prune']]);
      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([
        ['worktree', 'add', WORKTREE_PATH, BRANCH_NAME],
      ]);
      expect(proxy.getBuildSpawns()).toStrictEqual([
        { command: 'npm', args: ['run', 'build'], cwd: WORKTREE_PATH },
      ]);
    });

    it('VALID: {root node_modules already populated, package root not} => copies only the missing root and emits a skip line for the populated one', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const lines: unknown[] = [];
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: RECORDED_BASE_REF,
          operations: [
            OperationItemStub({
              id: SECOND_CARVE_OP_ID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${SECOND_CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupExistingWorktree();
      proxy.setupAlreadyPushed();
      proxy.setupWorktreeNodeModulesAlreadyPopulated();

      await questRunRiftcarverBroker({
        questId,
        workItemId,
        onLine: (line: string) => {
          lines.push(line);
        },
      });

      expect(proxy.getSymlinks()).toStrictEqual([
        {
          target: '/repo/packages/shared/node_modules/zod',
          linkPath: `${PACKAGE_WORKTREE_PATH}/node_modules/zod`,
        },
      ]);
      expect(lines).toStrictEqual([
        '— skip base branch: main already recorded and still resolves —',
        `— skip worktree: ${WORKTREE_PATH} is already a live worktree of ${BRANCH_NAME} —`,
        `— skip baseRef: already pinned at ${RECORDED_BASE_REF} —`,
        `— skip push: ${BRANCH_NAME} already tracks an upstream —`,
        `— skip ${WORKTREE_PATH} (node_modules already populated) —`,
        `— mirroring node_modules: ${PACKAGE_WORKTREE_PATH} —`,
        '— build pass 1/3 —',
        'Build succeeded',
        '— build green on pass 1/3 —',
        `— CARVED: ${BRANCH_NAME} at ${RECORDED_BASE_REF} —`,
      ]);
    });

    it('VALID: {every other step skipped} => the build still spawns — it is the deliberate exception to the done-check rule', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          branchName: BRANCH_NAME,
          baseBranch: 'main',
          worktreePath: WORKTREE_PATH,
          baseRef: RECORDED_BASE_REF,
          operations: [
            OperationItemStub({
              id: SECOND_CARVE_OP_ID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${SECOND_CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupExistingWorktree();
      proxy.setupAlreadyPushed();
      proxy.setupWorktreeNodeModulesAlreadyPopulated();

      await questRunRiftcarverBroker({ questId, workItemId, onLine: () => undefined });

      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([]);
      expect(proxy.getHeadShaSpawns()).toStrictEqual([]);
      expect(proxy.getBuildSpawns()).toStrictEqual([
        { command: 'npm', args: ['run', 'build'], cwd: WORKTREE_PATH },
      ]);
    });

    it('VALID: {two carve attempts on one quest} => two distinct riftcarver-results log files and two refs, never one overwritten', async () => {
      const questId = QuestIdStub();
      const firstWorkItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });
      const secondWorkItemId = QuestWorkItemIdStub({ value: FIRST_CARVE_WORK_ITEM_ID });
      const carveOp = OperationItemStub({
        id: CARVE_OP_ID,
        role: 'riftcarver',
        text: CARVE_TEXT,
        status: 'in_progress',
        locked: true,
      });
      const proxy = questRunRiftcarverBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [carveOp],
          workItems: [
            WorkItemStub({
              id: firstWorkItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${CARVE_OP_ID}`],
            }),
          ],
        }),
      });
      proxy.setupBuildFails({ lines: ['error TS2304: Cannot find name x'] });

      await questRunRiftcarverBroker({
        questId,
        workItemId: firstWorkItemId,
        onLine: () => undefined,
      });

      const afterFirstAttempt = proxy.getPersistedQuest();

      // Hand the pt 2 item its own work item, exactly as questAdvanceBroker would once the
      // spiritmender ahead of it signalled, and re-enter the broker against the worktree attempt 1
      // left behind.
      proxy.setupQuest({
        quest: QuestStub({
          ...afterFirstAttempt,
          operations: [
            OperationItemStub({ ...carveOp, status: 'complete' }),
            OperationItemStub({
              id: SECOND_UUID,
              role: 'spiritmender',
              text: `Spiritmender: fix riftcarver build failure — riftcarverResult ${RIFTCARVER_RESULT_ID}`,
              status: 'complete',
              locked: true,
            }),
            OperationItemStub({
              id: THIRD_UUID,
              role: 'riftcarver',
              text: `pt 2: ${CARVE_TEXT}`,
              status: 'in_progress',
              locked: true,
            }),
          ],
          workItems: [
            ...afterFirstAttempt.workItems,
            WorkItemStub({
              id: secondWorkItemId,
              role: 'riftcarver',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${THIRD_UUID}`],
            }),
          ],
        }),
      });

      await questRunRiftcarverBroker({
        questId,
        workItemId: secondWorkItemId,
        onLine: () => undefined,
      });

      expect(proxy.getRiftcarverLogWrites().map(({ path }) => path)).toStrictEqual([
        `${QUEST_FOLDER_PATH}/riftcarver-results/${RIFTCARVER_RESULT_ID}.log`,
        `${QUEST_FOLDER_PATH}/riftcarver-results/${FIFTH_UUID}.log`,
      ]);
      expect(proxy.getPersistedQuest().riftcarverResults).toStrictEqual([
        RiftcarverResultStub({
          id: RIFTCARVER_RESULT_ID,
          createdAt: FIXED_TIMESTAMP,
          exitCode: 1,
          failedStep: 'build',
          outcome: 'repairable',
        }),
        RiftcarverResultStub({
          id: FIFTH_UUID,
          createdAt: FIXED_TIMESTAMP,
          exitCode: 1,
          failedStep: 'build',
          outcome: 'repairable',
        }),
      ]);
      // The second attempt reused the worktree the first one carved — one add across both runs.
      expect(proxy.getWorktreeAddSpawns()).toStrictEqual([
        ['worktree', 'add', WORKTREE_PATH, '-b', BRANCH_NAME, 'main'],
      ]);
    });
  });
});
