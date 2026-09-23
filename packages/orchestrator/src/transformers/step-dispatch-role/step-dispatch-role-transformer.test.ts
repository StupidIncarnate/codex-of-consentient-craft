import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { stepDispatchRoleTransformer } from './step-dispatch-role-transformer';

const QUEST_ID = QuestIdStub({ value: 'step-dispatch-role-quest' });
const OPERATION_ID = OperationItemIdStub({ value: 'a1a1a1a1-1111-4222-9333-444444444444' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'b2b2b2b2-1111-4222-9333-444444444444' });

describe('stepDispatchRoleTransformer', () => {
  describe('a step naming a prompt', () => {
    it('VALID: {ward scope, step: repair} => spiritmender, which the scope role `ward` could never have said', () => {
      const operation = OperationItemStub({
        id: OPERATION_ID,
        role: 'ward',
        text: 'Ward gate (full monorepo)',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'ward',
        step: 'repair',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(OPERATION_ID)}` })],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operation],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: 'spiritmender',
        model: 'sonnet',
      });
    });

    it('VALID: {riftcarver scope, step: repair} => spiritmender, the same shape one family over', () => {
      const operation = OperationItemStub({
        id: OPERATION_ID,
        role: 'riftcarver',
        text: 'Carve the quest worktree',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'riftcarver',
        step: 'repair',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(OPERATION_ID)}` })],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operation],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: 'spiritmender',
        model: 'sonnet',
      });
    });

    it('VALID: {warpgate scope, step: merge} => warpgate, where the step and the scope agree', () => {
      const operation = OperationItemStub({
        id: OPERATION_ID,
        role: 'warpgate',
        text: 'Land the quest branch on base',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'warpgate',
        step: 'merge',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(OPERATION_ID)}` })],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operation],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: 'warpgate',
        model: 'opus',
      });
    });

    it('VALID: {codeweaver scope, step: work} => codeweaver-worker, where the step names a worker prompt', () => {
      const operation = OperationItemStub({
        id: OPERATION_ID,
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        step: 'work',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(OPERATION_ID)}` })],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operation],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: 'codeweaver-worker',
        model: 'sonnet',
      });
    });

    it('VALID: {codeweaver scope, step: review} => codeweaver-reviewer', () => {
      const operation = OperationItemStub({
        id: OPERATION_ID,
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        step: 'review',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(OPERATION_ID)}` })],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operation],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: 'codeweaver-reviewer',
        model: 'opus',
      });
    });
  });

  describe('a work item with no prompt step to read', () => {
    it('VALID: {ward scope, step: gate} => null, because a deterministic step spawns no session', () => {
      const operation = OperationItemStub({
        id: OPERATION_ID,
        role: 'ward',
        text: 'Ward gate (full monorepo)',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'ward',
        step: 'gate',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(OPERATION_ID)}` })],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operation],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: null,
        model: undefined,
      });
    });

    it('EMPTY: {work item carrying no step at all} => null', () => {
      const operation = OperationItemStub({
        id: OPERATION_ID,
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'in_progress',
      });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'codeweaver',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(OPERATION_ID)}` })],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [operation],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: null,
        model: undefined,
      });
    });

    it('EMPTY: {work item whose step names a family no operation item resolves to} => null', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'spiritmender',
        step: 'repair',
      });
      const quest = QuestStub({
        id: QUEST_ID,
        operations: [],
        workItems: [workItem],
      });

      expect(stepDispatchRoleTransformer({ quest, workItem })).toStrictEqual({
        prompt: null,
        model: undefined,
      });
    });
  });
});
