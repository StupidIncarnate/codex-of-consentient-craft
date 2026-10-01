import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { ChatCommandReplayResponder } from './chat-command-replay-responder';
import { ChatCommandReplayResponderProxy } from './chat-command-replay-responder.proxy';

const FIXED_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const CHAT_PROCESS_ID = `quest-replay-add-auth-${WORK_ITEM_ID}-command`;

describe('ChatCommandReplayResponder', () => {
  describe('a command item that saved output', () => {
    it('VALID: {carve output with ward redraw codes} => emits the cleaned lines as one replay chat-output, then chat-history-complete', () => {
      const proxy = ChatCommandReplayResponderProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });
      const { getEmittedEvents } = proxy.setupEventCapture();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'riftcarver',
        status: 'complete',
        declaredReason:
          '— base branch: master —\ntypecheck   @dungeonmaster/cli   running...\r\n\u001b[Ktypecheck   @dungeonmaster/cli   PASS  241 files, 241 discovered (14.1s)\n\n\r\u001b[K\n\n',
      });

      ChatCommandReplayResponder({ questId, workItem, chatProcessId: CHAT_PROCESS_ID });

      expect(getEmittedEvents()).toStrictEqual([
        {
          type: 'chat-output',
          processId: CHAT_PROCESS_ID,
          payload: {
            chatProcessId: CHAT_PROCESS_ID,
            entries: [
              {
                role: 'assistant',
                type: 'text',
                content: '— base branch: master —',
                uuid: FIXED_UUID,
                timestamp: FIXED_TIMESTAMP,
              },
              {
                role: 'assistant',
                type: 'text',
                content: 'typecheck   @dungeonmaster/cli   running...',
                uuid: FIXED_UUID,
                timestamp: FIXED_TIMESTAMP,
              },
              {
                role: 'assistant',
                type: 'text',
                content: 'typecheck   @dungeonmaster/cli   PASS  241 files, 241 discovered (14.1s)',
                uuid: FIXED_UUID,
                timestamp: FIXED_TIMESTAMP,
              },
            ],
            replay: true,
            questId,
            workItemId: WORK_ITEM_ID,
          },
        },
        {
          type: 'chat-history-complete',
          processId: CHAT_PROCESS_ID,
          payload: { chatProcessId: CHAT_PROCESS_ID, questId, workItemId: WORK_ITEM_ID },
        },
      ]);
    });
  });

  describe('a command item with nothing saved', () => {
    it('EMPTY: {no declaredReason} => emits only chat-history-complete', () => {
      const proxy = ChatCommandReplayResponderProxy();
      proxy.setupEntryIdentity({ uuid: FIXED_UUID, timestamp: FIXED_TIMESTAMP });
      const { getEmittedEvents } = proxy.setupEventCapture();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({ id: WORK_ITEM_ID, role: 'ward', status: 'pending' });

      ChatCommandReplayResponder({ questId, workItem, chatProcessId: CHAT_PROCESS_ID });

      expect(getEmittedEvents()).toStrictEqual([
        {
          type: 'chat-history-complete',
          processId: CHAT_PROCESS_ID,
          payload: { chatProcessId: CHAT_PROCESS_ID, questId, workItemId: WORK_ITEM_ID },
        },
      ]);
    });
  });
});
