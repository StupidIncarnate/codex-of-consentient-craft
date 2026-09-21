import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { stepHandlerRunBroker } from './step-handler-run-broker';
import { stepHandlerRunBrokerProxy } from './step-handler-run-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

describe('stepHandlerRunBroker', () => {
  describe('dispatching by handler name', () => {
    it('VALID: {handler: ward} => runs the ward handler and returns its result', async () => {
      const proxy = stepHandlerRunBrokerProxy();
      proxy.setupWardDone();

      const result = await stepHandlerRunBroker({
        handler: 'ward',
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });

    it('VALID: {handler: cleanup} => runs the cleanup handler and returns its result', async () => {
      const proxy = stepHandlerRunBrokerProxy();
      proxy.setupCleanupDone();

      const result = await stepHandlerRunBroker({
        handler: 'cleanup',
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });
  });

  describe('a handler that throws — the handler boundary', () => {
    it('ERROR: {ward hits a missing-worktree resolution} => classifies wall instead of rejecting', async () => {
      const proxy = stepHandlerRunBrokerProxy();
      proxy.setupWardMissingWorktree({ worktreePath: '/repo/worktrees/add-auth' });

      const result = await stepHandlerRunBroker({
        handler: 'ward',
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('wall');
    });

    it('ERROR: {ward hits a missing-worktree resolution} => detail carries the error message', async () => {
      const proxy = stepHandlerRunBrokerProxy();
      proxy.setupWardMissingWorktree({ worktreePath: '/repo/worktrees/add-auth' });

      const result = await stepHandlerRunBroker({
        handler: 'ward',
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.detail).toBe(
        `Cannot run ward for quest ${String(QUEST_ID)}: worktree not found: /repo/worktrees/add-auth`,
      );
    });
  });
});
