import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { commandChatOutputEmitTransformer } from './command-chat-output-emit-transformer';

const FIXED_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const WORK_ITEM_ID = 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5';

describe('commandChatOutputEmitTransformer', () => {
  describe('the emit shape every command dispatcher hands to the bus', () => {
    it('VALID: {ward line} => keys the event on the work item id and carries the line as one assistant-text entry', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });

      const result = commandChatOutputEmitTransformer({
        questId,
        workItemId,
        line: 'lint  @dungeonmaster/web  PASS',
      });

      expect(result).toStrictEqual({
        type: 'chat-output',
        processId: WORK_ITEM_ID,
        payload: {
          processId: WORK_ITEM_ID,
          chatProcessId: WORK_ITEM_ID,
          slotIndex: 0,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'lint  @dungeonmaster/web  PASS',
              uuid: FIXED_UUID,
              timestamp: FIXED_TIMESTAMP,
            },
          ],
          questId,
          workItemId,
        },
      });
    });

    // The riftcarver call site differs in nothing but the line it passes. Asserting the identical
    // full shape here is what pins that: a per-role variation would show up as a diff on this
    // object, which is exactly the drift the extraction removes.
    it('VALID: {riftcarver line} => produces the identical event shape, differing only in the streamed content', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });

      const result = commandChatOutputEmitTransformer({
        questId,
        workItemId,
        line: '— baseRef a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2 —',
      });

      expect(result).toStrictEqual({
        type: 'chat-output',
        processId: WORK_ITEM_ID,
        payload: {
          processId: WORK_ITEM_ID,
          chatProcessId: WORK_ITEM_ID,
          slotIndex: 0,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: '— baseRef a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2 —',
              uuid: FIXED_UUID,
              timestamp: FIXED_TIMESTAMP,
            },
          ],
          questId,
          workItemId,
        },
      });
    });

    it('EDGE: {line: ""} => still emits one entry, so a blank command line reaches the panel', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });

      const result = commandChatOutputEmitTransformer({ questId, workItemId, line: '' });

      expect(result).toStrictEqual({
        type: 'chat-output',
        processId: WORK_ITEM_ID,
        payload: {
          processId: WORK_ITEM_ID,
          chatProcessId: WORK_ITEM_ID,
          slotIndex: 0,
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: '',
              uuid: FIXED_UUID,
              timestamp: FIXED_TIMESTAMP,
            },
          ],
          questId,
          workItemId,
        },
      });
    });
  });
});
