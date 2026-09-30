import { OperationItemStub } from '@dungeonmaster/shared/contracts/operation-item/operation-item.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { stepHandlerCommitBroker } from './step-handler-commit-broker';
import { stepHandlerCommitBrokerProxy } from './step-handler-commit-broker.proxy';

type ContentText = string;

const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
const OPERATION_ID = '11111111-1111-4111-8111-111111111111';

const buildQuest = ({ questId }: { questId: ReturnType<typeof QuestIdStub> }) => {
  const operation = OperationItemStub({
    id: OPERATION_ID,
    role: 'codeweaver',
    text: 'add-auth — package: auth · flow: login-flow',
    status: 'complete',
  });
  const workItem = WorkItemStub({
    id: WORK_ITEM_ID,
    role: 'codeweaver',
    step: 'commit',
    status: 'in_progress',
    spawnerType: 'command',
    relatedDataItems: [`operations/${OPERATION_ID}`],
    observations: [],
  });
  return QuestStub({ id: questId, operations: [operation], workItems: [workItem] });
};

describe('stepHandlerCommitBroker', () => {
  describe('a dirty tree', () => {
    it('VALID: {working tree carries a changed file} => classifies done', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/token-store.ts'] });

      const result = await stepHandlerCommitBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });
  });

  describe('a clean tree', () => {
    it('EMPTY: {working tree carries nothing} => classifies empty', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      proxy.setupWorkingTreeFiles({ files: [] });

      const result = await stepHandlerCommitBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('empty');
    });

    it('EMPTY: {a tree carrying only an UNTRACKED file} => still classifies done, not empty', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      // gitWorkingTreeFilesBroker's own job is unioning untracked additions in — a bare `git diff
      // HEAD` would report this tree clean, and this handler must not.
      proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/new-untracked-file.ts'] });

      const result = await stepHandlerCommitBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });
  });

  describe('the push', () => {
    it('VALID: {commit completes} => pushes with the bare `git push` in the worktree', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      proxy.setupWorktree({ questId, worktreePath: '/repo/worktrees/add-auth' });
      proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/x.ts'] });

      await stepHandlerCommitBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(proxy.getPushCall()).toStrictEqual({
        command: 'git',
        args: ['push'],
        cwd: '/repo/worktrees/add-auth',
      });
    });

    it('VALID: {push fails} => still classifies done — a failed push is never a wall', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/x.ts'] });
      proxy.setupPushFails({ output: 'fatal: Authentication failed' });

      const result = await stepHandlerCommitBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });
  });

  describe('a missing worktree', () => {
    it('ERROR: {missing-worktree resolution} => throws — a wall at the handler boundary', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      proxy.setupWorktreeMissing({ questId, worktreePath: '/repo/worktrees/add-auth' });

      await expect(
        stepHandlerCommitBroker({
          args: [],
          questId,
          workItemId: WORK_ITEM_ID,
          onLine: () => undefined,
        }),
      ).rejects.toThrow(/worktree not found/u);
    });
  });

  describe('the commit message', () => {
    it('VALID: {no marks} => still commits, carrying the step and work item id alone', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/x.ts'] });

      await stepHandlerCommitBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(proxy.getCommitMessage()).toBe(
        `codeweaver/commit: add-auth — package: auth · flow: login-flow\n\nwork items: ${String(WORK_ITEM_ID)}`,
      );
    });
  });

  describe('onLine streaming', () => {
    it('VALID: {a commit pass} => each git verb reaches the callback DURING the run', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerCommitBrokerProxy();
      proxy.setupQuest({ quest: buildQuest({ questId }) });
      proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/x.ts'] });
      const seenLines: ContentText[] = [];

      await stepHandlerCommitBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: (line) => seenLines.push(line),
      });

      expect(seenLines[0]).toBe('git add -A');
    });
  });
});
