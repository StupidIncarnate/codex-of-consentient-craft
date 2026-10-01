import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { orchestrationEventsHarness } from '../../../test/harnesses/orchestration-events/orchestration-events.harness';

import { ChatCommandReplayFlow } from './chat-command-replay-flow';

const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const CHAT_PROCESS_ID = `quest-replay-add-auth-${WORK_ITEM_ID}-command`;

describe('ChatCommandReplayFlow', () => {
  const eventsHarness = orchestrationEventsHarness();

  describe('delegation to responder', () => {
    it('VALID: {ward step that saved redraw-laden output} => emits the cleaned lines as replay chat-output, then chat-history-complete', () => {
      const collected = eventsHarness.collect({ types: ['chat-output', 'chat-history-complete'] });
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID,
        role: 'ward',
        status: 'complete',
        declaredReason:
          'lint        @dungeonmaster/web running...\r\u001b[Klint        @dungeonmaster/web PASS  3 files, 3 discovered (9.0s)\n\r\u001b[K\n',
      });

      ChatCommandReplayFlow({ questId, workItem, chatProcessId: CHAT_PROCESS_ID });

      expect(collected.events()).toStrictEqual([
        {
          type: 'chat-output',
          processId: CHAT_PROCESS_ID,
          contents: [
            'lint        @dungeonmaster/web running...',
            'lint        @dungeonmaster/web PASS  3 files, 3 discovered (9.0s)',
          ],
          replay: true,
          workItemId: WORK_ITEM_ID,
        },
        {
          type: 'chat-history-complete',
          processId: CHAT_PROCESS_ID,
          contents: [],
          replay: undefined,
          workItemId: WORK_ITEM_ID,
        },
      ]);
    });

    it('EMPTY: {command step that saved no output} => emits only chat-history-complete', () => {
      const collected = eventsHarness.collect({ types: ['chat-output', 'chat-history-complete'] });
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItem = WorkItemStub({ id: WORK_ITEM_ID, role: 'ward', status: 'pending' });

      ChatCommandReplayFlow({ questId, workItem, chatProcessId: CHAT_PROCESS_ID });

      expect(collected.events()).toStrictEqual([
        {
          type: 'chat-history-complete',
          processId: CHAT_PROCESS_ID,
          contents: [],
          replay: undefined,
          workItemId: WORK_ITEM_ID,
        },
      ]);
    });
  });
});
