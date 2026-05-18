import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { QuestHandleSignalBackResponderProxy } from './quest-handle-signal-back-responder.proxy';

describe('QuestHandleSignalBackResponder', () => {
  describe('pathseeker-walk + complete', () => {
    it('VALID: {role: pathseeker-walk, signal: complete} => invokes post-walk hook and returns success', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
        status: 'complete',
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
    });
  });

  describe('non-walk roles and non-complete signals', () => {
    it('VALID: {role: codeweaver, signal: complete} => no-op, returns success without invoking hook', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const itemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const codeweaverItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'complete',
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [codeweaverItem],
      });
      proxy.setupQuest({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });

    it('VALID: {role: pathseeker-walk, signal: failed} => no-op, returns success without invoking hook', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
        status: 'failed',
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
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });

    it('VALID: {role: pathseeker-walk, signal: failed-replan} => no-op, returns success without invoking hook', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const walkItem = WorkItemStub({
        id: walkId,
        role: 'pathseeker-walk',
        status: 'failed',
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
        signal: 'failed-replan',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });

    it('VALID: {workItem not in quest} => no-op, returns success', async () => {
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
