import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import { commandChatOutputEmitTransformer } from './command-chat-output-emit-transformer';
import { commandChatOutputEmitTransformerProxy } from './command-chat-output-emit-transformer.proxy';

const FIXED_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const WORK_ITEM_ID = '54abb935-7a96-3e73-83b3-3d46fdc6f046';

describe('commandChatOutputEmitTransformer', () => {
  describe('the emit shape every command dispatcher hands to the bus', () => {
    it('VALID: {ward line} => keys the event on the work item id and carries the line as one assistant-text entry', () => {
      const proxy = commandChatOutputEmitTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });

      const result = commandChatOutputEmitTransformer({
        questId,
        workItemId,
        text: 'lint  @dungeonmaster/web  PASS',
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

    // The riftcarver call site differs in nothing but the text it passes. Asserting the identical
    // full shape here is what pins that: a per-role variation would show up as a diff on this
    // object, which is exactly the drift the extraction removes.
    it('VALID: {riftcarver line} => produces the identical event shape, differing only in the streamed content', () => {
      const proxy = commandChatOutputEmitTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });

      const result = commandChatOutputEmitTransformer({
        questId,
        workItemId,
        text: '— baseRef a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2 —',
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

    it('VALID: {stderr chunk of a running line overwritten by its result} => one entry per line, redraw codes removed', () => {
      const proxy = commandChatOutputEmitTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });

      const result = commandChatOutputEmitTransformer({
        questId,
        workItemId,
        text: 'unit  @dungeonmaster/web running...\r\u001b[Klint  @dungeonmaster/mcp PASS\n',
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
              content: 'unit  @dungeonmaster/web running...',
              uuid: FIXED_UUID,
              timestamp: FIXED_TIMESTAMP,
            },
            {
              role: 'assistant',
              type: 'text',
              content: 'lint  @dungeonmaster/mcp PASS',
              uuid: FIXED_UUID,
              timestamp: FIXED_TIMESTAMP,
            },
          ],
          questId,
          workItemId,
        },
      });
    });

    it('EMPTY: {text: only an erase-line redraw} => carries no entries', () => {
      const proxy = commandChatOutputEmitTransformerProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: WORK_ITEM_ID });

      const result = commandChatOutputEmitTransformer({
        questId,
        workItemId,
        text: '\r\u001b[K\n',
      });

      expect(result).toStrictEqual({
        type: 'chat-output',
        processId: WORK_ITEM_ID,
        payload: {
          processId: WORK_ITEM_ID,
          chatProcessId: WORK_ITEM_ID,
          slotIndex: 0,
          entries: [],
          questId,
          workItemId,
        },
      });
    });
  });
});
