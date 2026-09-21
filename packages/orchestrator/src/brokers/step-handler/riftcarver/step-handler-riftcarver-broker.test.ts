import {
  ContentTextStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { stepHandlerRiftcarverBroker } from './step-handler-riftcarver-broker';
import { stepHandlerRiftcarverBrokerProxy } from './step-handler-riftcarver-broker.proxy';

type ContentText = ReturnType<typeof ContentTextStub>;

const RIFTCARVER_RESULT_ID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5' });

describe('stepHandlerRiftcarverBroker', () => {
  describe('GREEN — a first carve on a quest with no git context', () => {
    it('VALID: {no branch, no worktree, typecheck passes} => classifies done', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerRiftcarverBrokerProxy();
      proxy.setupQuest({ quest: QuestStub({ id: questId, status: 'in_progress' }) });

      const result = await stepHandlerRiftcarverBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });

    it('VALID: {carve completes} => resultRef points at the riftcarverResults ref', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerRiftcarverBrokerProxy();
      proxy.setupQuest({ quest: QuestStub({ id: questId, status: 'in_progress' }) });

      const result = await stepHandlerRiftcarverBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.resultRef).toBe(`riftcarverResults/${RIFTCARVER_RESULT_ID}`);
    });

    it('VALID: {carve completes} => persists the riftcarver result onto the quest', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerRiftcarverBrokerProxy();
      proxy.setupQuest({ quest: QuestStub({ id: questId, status: 'in_progress' }) });

      await stepHandlerRiftcarverBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      const persisted = proxy.getPersistedQuest();

      expect({
        outcome: persisted.riftcarverResults[0]?.outcome,
        exitCode: persisted.riftcarverResults[0]?.exitCode,
      }).toStrictEqual({ outcome: 'green', exitCode: 0 });
    });
  });

  describe('a repairable red — typecheck fails', () => {
    it('VALID: {typecheck fails} => classifies unmet', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerRiftcarverBrokerProxy();
      proxy.setupQuest({ quest: QuestStub({ id: questId, status: 'in_progress' }) });
      proxy.setupTypecheckFails({ lines: ['error TS2322: Type mismatch'] });

      const result = await stepHandlerRiftcarverBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('unmet');
    });
  });

  describe('a git-state red — worktree add fails', () => {
    it('ERROR: {worktree add fails} => classifies wall — no worktree to send a repair into', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerRiftcarverBrokerProxy();
      proxy.setupQuest({ quest: QuestStub({ id: questId, status: 'in_progress' }) });
      proxy.setupWorktreeAddFails({ output: 'fatal: could not create work tree' });

      const result = await stepHandlerRiftcarverBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('wall');
    });
  });

  describe('a permission denial — overrides a step that classifies repairable', () => {
    it('ERROR: {push fails with a permission-denied message} => classifies wall, not unmet', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerRiftcarverBrokerProxy();
      proxy.setupQuest({ quest: QuestStub({ id: questId, status: 'in_progress' }) });
      proxy.setupPushFails({ output: 'fatal: permission denied (publickey)' });

      const result = await stepHandlerRiftcarverBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('wall');
    });
  });

  describe('onLine streaming', () => {
    it('VALID: {a green carve} => the CARVED verdict line reaches the callback DURING the run', async () => {
      const questId = QuestIdStub();
      const proxy = stepHandlerRiftcarverBrokerProxy();
      proxy.setupQuest({ quest: QuestStub({ id: questId, status: 'in_progress' }) });
      const seenLines: ContentText[] = [];

      await stepHandlerRiftcarverBroker({
        args: [],
        questId,
        workItemId: WORK_ITEM_ID,
        onLine: (line) => seenLines.push(ContentTextStub({ value: line })),
      });

      const verdictLines = seenLines.filter((line) => line.startsWith('— CARVED:'));

      expect(verdictLines.length).toBeGreaterThan(0);
    });
  });
});
