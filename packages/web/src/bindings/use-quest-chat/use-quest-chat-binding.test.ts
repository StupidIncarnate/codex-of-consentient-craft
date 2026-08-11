import {
  AskUserQuestionStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  UserInputStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';

import { useQuestChatBinding } from './use-quest-chat-binding';
import { useQuestChatBindingProxy } from './use-quest-chat-binding.proxy';

// The message questLoadBroker produces when questContract rejects a field, relayed verbatim by the
// server's subscribe-quest failure path.
const LOAD_FAILURE_REASON =
  'Failed to parse quest file at /home/dm/guilds/g1/quests/q1/quest.json: comments.0.createdAt: Invalid datetime';

// The markdown turn the server echoes back after storing a comment batch. Claude's --resume stream
// never replays the prompt, so this string is the only copy the panel can render for the user's own
// turn — the entry content must match it character for character.
const DELIVERED_COMMENT_MESSAGE =
  '## Feedback on flow "login-flow"\n\n- **login-page**: This assertion looks wrong';

describe('useQuestChatBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {questId: null} => starts with empty entries map and not streaming', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupConnectedChannel();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: null }),
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('subscribe-quest on mount', () => {
    it('VALID: {questId provided on mount} => sends subscribe-quest over WS', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-sub-1' });

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      const sentMessages = proxy.getSentWsMessages();

      expect(sentMessages).toStrictEqual([{ type: 'subscribe-quest', questId: 'quest-sub-1' }]);
    });

    it('EMPTY: {questId: null} => does not send subscribe-quest', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: null }),
      });

      const sentMessages = proxy.getSentWsMessages();

      expect(sentMessages).toStrictEqual([]);
    });
  });

  describe('chat-output handling', () => {
    it('VALID: {chat-output with sessionId} => buckets entries under that session and sets isStreaming', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-out-1' });
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entryUuid = '00000000-0000-4000-8000-000000000001';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-out-1',
                workItemId: QuestWorkItemIdStub(),
                sessionId,
                chatProcessId: ProcessIdStub({ value: 'proc-1' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'hello',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const expectedMap = new Map();
      expectedMap.set(sessionId, [
        {
          role: 'assistant',
          type: 'text',
          content: 'hello',
          uuid: entryUuid,
          timestamp: entryTs,
        },
      ]);
      // The same entry is also bucketed by workItemId so the execution panel can scope it
      // to its own row (sibling sub-agents share one parent sessionId).
      const expectedWorkItemMap = new Map();
      expectedWorkItemMap.set(QuestWorkItemIdStub(), [
        {
          role: 'assistant',
          type: 'text',
          content: 'hello',
          uuid: entryUuid,
          timestamp: entryTs,
        },
      ]);

      expect(result.current).toStrictEqual({
        entriesBySession: expectedMap,
        entriesByWorkItem: expectedWorkItemMap,
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: true,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {chat-output for different questId} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-mine' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-other',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-2' }),
                entries: [{ role: 'assistant', type: 'text', content: 'noise' }],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {chat-output without questId on payload} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-anchor' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                workItemId: QuestWorkItemIdStub(),
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d480' }),
                chatProcessId: ProcessIdStub({ value: 'proc-orphan' }),
                // Fully-formed entries: the payload must be rejected by the questId filter,
                // not by chatEntryContract. Entries missing uuid/timestamp are dropped as
                // unparseable before the filter is ever consulted, which passes this
                // assertion even with no quest scoping at all.
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'orphan',
                    uuid: '00000000-0000-4000-8000-0000000000a1',
                    timestamp: '2025-01-01T00:00:00.000Z',
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {chat-output tagged with a DIFFERENT questId} => is ignored, leaving this quest idle', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-being-viewed' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-running-in-another-tab',
                workItemId: QuestWorkItemIdStub(),
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d481' }),
                chatProcessId: ProcessIdStub({ value: 'proc-other-quest' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'work belonging to the other quest',
                    uuid: '00000000-0000-4000-8000-0000000000a2',
                    timestamp: '2025-01-01T00:00:00.000Z',
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('quest-modified handling', () => {
    it('VALID: {quest-modified for matching questId} => sets quest', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-mod-1' });
      const quest = QuestStub({ id: questId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-mod-1', quest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {quest-modified for different questId} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-mine' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: {
                questId: 'quest-other',
                quest: QuestStub({ id: QuestIdStub({ value: 'quest-other' }) }),
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('quest-load-failed handling', () => {
    it('ERROR: {quest-load-failed for matching questId} => exposes the reason as loadError and leaves quest null', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-broken-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-load-failed',
              payload: { questId: 'quest-broken-1', error: LOAD_FAILURE_REASON },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: LOAD_FAILURE_REASON,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {quest-load-failed for different questId} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-mine' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-load-failed',
              payload: { questId: 'quest-other', error: LOAD_FAILURE_REASON },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('VALID: {quest-load-failed then quest-modified for the same quest} => loadError clears with the quest', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-repaired-1' });
      const quest = QuestStub({ id: questId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-load-failed',
              payload: { questId: 'quest-repaired-1', error: LOAD_FAILURE_REASON },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-repaired-1', quest },
              timestamp: '2025-01-01T00:00:01.000Z',
            }),
          });
        },
      });

      // A stale error beside a quest that now loads would keep the route showing a failure it has
      // already recovered from.
      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('chat-history-complete handling', () => {
    it('VALID: {chat-history-complete after chat-output} => sets isStreaming to false', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-hist-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-hist-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-h' }),
                entries: [{ role: 'assistant', type: 'text', content: 'replay' }],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-history-complete',
              payload: { chatProcessId: ProcessIdStub({ value: 'proc-h' }) },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('clarification-request handling', () => {
    it('VALID: {clarification-request} => sets pendingClarification', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-clarify-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'clarification-request',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-c' }),
                questions: [
                  {
                    question: 'Which DB?',
                    header: 'Database',
                    options: [{ label: 'Postgres', description: 'Relational' }],
                    multiSelect: false,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.pendingClarification).toStrictEqual({
        questions: [
          {
            question: 'Which DB?',
            header: 'Database',
            options: [{ label: 'Postgres', description: 'Relational' }],
            multiSelect: false,
          },
        ],
      });
    });
  });

  describe('sendMessage', () => {
    it('VALID: {questId, message} => appends user entry, sets isStreaming, posts to questChat', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-send-1' });
      const message = UserInputStub({ value: 'Hi' });
      const synthUuid = '00000000-0000-4000-8000-00000000000a';
      const synthTs = '2025-01-01T00:00:00.000Z';
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-send' }) });
      proxy.setupUuids({ uuids: [synthUuid] });
      proxy.setupTimestamps({ timestamps: [synthTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      const synthKey = '__no_session__' as ReturnType<typeof SessionIdStub>;
      const expectedMap = new Map();
      expectedMap.set(synthKey, [
        { role: 'user', content: 'Hi', uuid: synthUuid, timestamp: synthTs },
      ]);

      expect(result.current).toStrictEqual({
        entriesBySession: expectedMap,
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: true,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('sendCommentBatch', () => {
    it('VALID: {outcome sent with deliveredMessage} => appends a user entry holding that exact markdown and arms isStreaming', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-comment-sent-1' });
      const synthUuid = '00000000-0000-4000-8000-0000000000c1';
      const synthTs = '2026-07-01T12:00:00.000Z';
      proxy.setupCommentBatchSent({
        chatProcessId: ProcessIdStub({ value: 'proc-comment-sent' }),
        deliveredMessage: DELIVERED_COMMENT_MESSAGE,
      });
      proxy.setupUuids({ uuids: [synthUuid] });
      proxy.setupTimestamps({ timestamps: [synthTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.sendCommentBatch({ comments: [CommentQueueEntryStub()] });
        },
      });

      const synthKey = '__no_session__' as ReturnType<typeof SessionIdStub>;
      const expectedMap = new Map();
      expectedMap.set(synthKey, [
        {
          role: 'user',
          content: DELIVERED_COMMENT_MESSAGE,
          uuid: synthUuid,
          timestamp: synthTs,
        },
      ]);

      expect(result.current).toStrictEqual({
        entriesBySession: expectedMap,
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: true,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {outcome sent without deliveredMessage} => returns the sent outcome and appends no chat entry', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-comment-sent-2' });
      proxy.setupCommentBatchSentWithoutDeliveredMessage({
        chatProcessId: ProcessIdStub({ value: 'proc-comment-bare' }),
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      const outcomes: unknown[] = [];
      await testingLibraryActAsyncAdapter({
        callback: async () => {
          outcomes.push(
            await result.current.sendCommentBatch({ comments: [CommentQueueEntryStub()] }),
          );
        },
      });

      // An older server that does not echo the turn back still delivered the batch, so the send
      // succeeds — there is simply no rendered markdown to put in the panel.
      expect({
        outcomes,
        entriesBySession: result.current.entriesBySession,
        isStreaming: result.current.isStreaming,
      }).toStrictEqual({
        outcomes: [{ outcome: 'sent', chatProcessId: 'proc-comment-bare' }],
        entriesBySession: new Map(),
        isStreaming: false,
      });
    });

    it('INVALID: {outcome stale} => returns the stale anchors and appends no chat entry', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-comment-stale-1' });
      proxy.setupCommentBatchStale({
        staleAnchors: [CommentAnchorStub({ flowId: 'login-flow', nodeId: 'login-page' })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      const outcomes: unknown[] = [];
      await testingLibraryActAsyncAdapter({
        callback: async () => {
          outcomes.push(
            await result.current.sendCommentBatch({ comments: [CommentQueueEntryStub()] }),
          );
        },
      });

      // A stale batch reached no agent, so rendering it would claim feedback was sent that never was.
      expect({
        outcomes,
        entriesBySession: result.current.entriesBySession,
        isStreaming: result.current.isStreaming,
      }).toStrictEqual({
        outcomes: [
          { outcome: 'stale', staleAnchors: [{ flowId: 'login-flow', nodeId: 'login-page' }] },
        ],
        entriesBySession: new Map(),
        isStreaming: false,
      });
    });

    it('ERROR: {outcome failed} => returns the failure and appends no chat entry', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-comment-failed-1' });
      proxy.setupCommentBatchFailed({ error: 'quest is not running' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      const outcomes: unknown[] = [];
      await testingLibraryActAsyncAdapter({
        callback: async () => {
          outcomes.push(
            await result.current.sendCommentBatch({ comments: [CommentQueueEntryStub()] }),
          );
        },
      });

      expect({
        outcomes,
        entriesBySession: result.current.entriesBySession,
        isStreaming: result.current.isStreaming,
      }).toStrictEqual({
        outcomes: [{ outcome: 'failed', error: 'quest is not running' }],
        entriesBySession: new Map(),
        isStreaming: false,
      });
    });

    it('EMPTY: {questId: null} => returns a failed outcome without POSTing the batch', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: null }),
      });

      const outcomes: unknown[] = [];
      await testingLibraryActAsyncAdapter({
        callback: async () => {
          outcomes.push(
            await result.current.sendCommentBatch({ comments: [CommentQueueEntryStub()] }),
          );
        },
      });

      expect({
        outcomes,
        requestCount: proxy.getCommentBatchRequestCount(),
        entriesBySession: result.current.entriesBySession,
      }).toStrictEqual({
        outcomes: [{ outcome: 'failed', error: 'No active quest to send comments to' }],
        requestCount: 0,
        entriesBySession: new Map(),
      });
    });
  });

  describe('cleanup', () => {
    it('EDGE: {unmount with active questId} => sends unsubscribe-quest (channel keeps socket)', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-unmount-1' });

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-unmount-1' },
        { type: 'unsubscribe-quest', questId: 'quest-unmount-1' },
      ]);
    });
  });

  describe('sendMessage pause→resume', () => {
    it('VALID: {quest paused} => resumes quest before posting chat', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-pause-resume-1' });
      const message = UserInputStub({ value: 'Hello after pause' });
      const pausedQuest = QuestStub({ id: questId, status: 'paused' });
      proxy.setupResume({ restoredStatus: 'in_progress' });
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-pr' }) });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-pause-resume-1', quest: pausedQuest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect({
        resume: proxy.getResumeRequestCount(),
        chat: proxy.getChatRequestCount(),
      }).toStrictEqual({ resume: 1, chat: 1 });
    });

    it('EDGE: {quest paused, resume fails} => chat is not invoked because resume promise rejects first', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-pause-resume-2' });
      const message = UserInputStub({ value: 'Hello after pause' });
      const pausedQuest = QuestStub({ id: questId, status: 'paused' });
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-pr-2' }) });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-pause-resume-2', quest: pausedQuest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect({
        resume: proxy.getResumeRequestCount(),
        chat: proxy.getChatRequestCount(),
      }).toStrictEqual({ resume: 1, chat: 0 });
    });
  });

  describe('chat-complete handling', () => {
    it('VALID: {chat-complete after chat-output} => sets isStreaming to false', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-complete-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-complete-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-cc' }),
                entries: [{ role: 'assistant', type: 'text', content: 'streaming' }],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-cc' }),
                exitCode: 0,
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('VALID: {armed turn ends with chat-complete and NO chat-output} => isStreaming returns to false', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-silent-turn' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.armStreaming();
        },
      });
      const whileArmed = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-silent' }),
                exitCode: 0,
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      // A turn that emitted nothing still ended. Gating the running state on "output arrived"
      // leaves the composer showing STOP with no turn behind it and no way back except a reload.
      expect({ whileArmed, afterTurnEnded: result.current.isStreaming }).toStrictEqual({
        whileArmed: true,
        afterTurnEnded: false,
      });
    });

    it('VALID: {armed turn, then chat-history-complete} => isStreaming STAYS true, because a replay draining is not the turn ending', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-replay-vs-turn' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.armStreaming();
        },
      });
      const whileArmed = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          // The subscribe-quest replay finisher, which lands a couple hundred ms after a browser
          // binds a quest — squarely inside the window where a just-sent turn has no token yet.
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-history-complete',
              payload: { questId: 'quest-replay-vs-turn' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect({ whileArmed, afterHistoryReplayed: result.current.isStreaming }).toStrictEqual({
        whileArmed: true,
        afterHistoryReplayed: true,
      });
    });

    it('VALID: {sent turn, then chat-complete for a FOREIGN chatProcessId} => isStreaming holds until this turn own chat-complete arrives', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-foreign-complete' });
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-mine' }) });
      proxy.setupUuids({ uuids: ['00000000-0000-4000-8000-0000000000f1'] });
      proxy.setupTimestamps({ timestamps: ['2026-08-05T00:00:00.000Z'] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message: UserInputStub({ value: 'Hi' }) });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });
      const afterSend = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          // Two completions belonging to other processes — a sibling work item finishing, another
          // browser's replay draining. Neither is the turn this composer is tracking.
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-someone-else' }),
                exitCode: 0,
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
              },
              timestamp: '2026-08-05T00:00:01.000Z',
            }),
          });
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-a-third-one' }),
                exitCode: 0,
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
              },
              timestamp: '2026-08-05T00:00:02.000Z',
            }),
          });
        },
      });
      const afterForeignCompletions = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-mine' }),
                exitCode: 0,
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
              },
              timestamp: '2026-08-05T00:00:03.000Z',
            }),
          });
        },
      });

      // No chat-output is delivered anywhere in this scenario: the running state must survive the
      // slow-first-response window on its own, and clear on this turn's own completion — not be
      // wiped by a stranger's and restored by the first token that happens to arrive.
      expect({
        afterSend,
        afterForeignCompletions,
        afterOwnCompletion: result.current.isStreaming,
      }).toStrictEqual({
        afterSend: true,
        afterForeignCompletions: true,
        afterOwnCompletion: false,
      });
    });

    it('VALID: {turn ended, then LATE chat-output for that same ended chatProcessId} => the entry renders but isStreaming stays false', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-late-output' });
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entryUuid = '00000000-0000-4000-8000-0000000000e1';
      const entryTs = '2026-08-09T00:00:05.000Z';
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-ended' }) });
      proxy.setupUuids({ uuids: ['00000000-0000-4000-8000-0000000000e0'] });
      proxy.setupTimestamps({ timestamps: ['2026-08-09T00:00:00.000Z'] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message: UserInputStub({ value: 'Hi' }) });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-ended' }),
                exitCode: 0,
                sessionId,
              },
              timestamp: '2026-08-09T00:00:01.000Z',
            }),
          });
        },
      });
      const afterTurnEnded = result.current.isStreaming;

      // The agent's transcript keeps arriving AFTER its turn is over: the CLI writes its session
      // JSONL at exit and the post-exit tail replays it. This output names the process that has
      // already completed, so it is a transcript draining, not an agent working — and no second
      // chat-complete is ever coming for it, so re-arming here pins the composer on STOP forever.
      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-late-output',
                sessionId,
                chatProcessId: ProcessIdStub({ value: 'proc-ended' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'late tail line',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2026-08-09T00:00:06.000Z',
            }),
          });
        },
      });

      expect({
        afterTurnEnded,
        afterLateOutput: result.current.isStreaming,
        renderedLateEntry: result.current.entriesBySession.get(sessionId),
      }).toStrictEqual({
        afterTurnEnded: false,
        afterLateOutput: false,
        renderedLateEntry: [
          {
            role: 'assistant',
            type: 'text',
            content: 'late tail line',
            uuid: entryUuid,
            timestamp: entryTs,
          },
        ],
      });
    });

    it('VALID: {turn ended, then chat-output for a NEW chatProcessId} => isStreaming arms again, so a genuinely new turn still shows STOP', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-new-turn-output' });
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-first' }) });
      proxy.setupUuids({ uuids: ['00000000-0000-4000-8000-0000000000e2'] });
      proxy.setupTimestamps({ timestamps: ['2026-08-09T00:00:00.000Z'] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message: UserInputStub({ value: 'Hi' }) });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-first' }),
                exitCode: 0,
                sessionId,
              },
              timestamp: '2026-08-09T00:00:01.000Z',
            }),
          });
        },
      });
      const afterTurnEnded = result.current.isStreaming;

      // The non-vacuous partner of the case above: only the ENDED process is muted. A different
      // process emitting is a real turn under way, and the composer must report it.
      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-new-turn-output',
                sessionId,
                chatProcessId: ProcessIdStub({ value: 'proc-second' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'a new turn is emitting',
                    uuid: '00000000-0000-4000-8000-0000000000e3',
                    timestamp: '2026-08-09T00:00:07.000Z',
                  },
                ],
              },
              timestamp: '2026-08-09T00:00:07.000Z',
            }),
          });
        },
      });

      expect({ afterTurnEnded, afterNewProcessOutput: result.current.isStreaming }).toStrictEqual({
        afterTurnEnded: false,
        afterNewProcessOutput: true,
      });
    });

    it('VALID: {armed turn, then bound to a DIFFERENT quest} => isStreaming clears, so an idle workspace never inherits it', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();

      let activeQuestId = QuestIdStub({ value: 'quest-armed-a' });

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: activeQuestId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.armStreaming();
        },
      });
      const whileArmed = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          activeQuestId = QuestIdStub({ value: 'quest-armed-b' });
          rerender();
        },
      });

      expect({ whileArmed, afterQuestSwitch: result.current.isStreaming }).toStrictEqual({
        whileArmed: true,
        afterQuestSwitch: false,
      });
    });
  });

  describe('submitClarifyAnswers', () => {
    it('VALID: {questions, answers} => POSTs to questClarify endpoint once', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-clarify-submit-1' });
      proxy.setupClarify({ chatProcessId: ProcessIdStub({ value: 'proc-clar' }) });
      const stub = AskUserQuestionStub();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.submitClarifyAnswers({
            questions: stub.questions,
            answers: [{ header: 'Preference', label: 'Option A' }],
          });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.isStreaming).toBe(true);
    });
  });

  describe('stopChat', () => {
    it('VALID: {questId set} => POSTs to questPause endpoint once', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-stop-1' });
      proxy.setupPause();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.stopChat();
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(proxy.getPauseRequestCount()).toBe(1);
    });
  });

  describe('chat-output without sessionId', () => {
    it('VALID: {chat-output sans sessionId} => buckets entries under synthetic __no_session__ key', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-nosession-1' });
      const entryUuid = '00000000-0000-4000-8000-000000000099';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-nosession-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-ns' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'no-sess',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const synthKey = '__no_session__' as ReturnType<typeof SessionIdStub>;
      const expectedMap = new Map();
      expectedMap.set(synthKey, [
        {
          role: 'assistant',
          type: 'text',
          content: 'no-sess',
          uuid: entryUuid,
          timestamp: entryTs,
        },
      ]);

      expect(result.current.entriesBySession).toStrictEqual(expectedMap);
    });
  });

  describe('invalid messages', () => {
    it('EDGE: {invalid WS message shape} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-bad-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({ not: 'valid' }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('reconnect', () => {
    it('VALID: {WS closes and reconnects} => re-sends subscribe-quest and post-reconnect chat-output updates state', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-reconnect-1' });
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entryUuid = '00000000-0000-4000-8000-000000000042';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
      ]);

      testingLibraryActAdapter({
        callback: () => {
          proxy.triggerWsClose();
          proxy.triggerWsReconnect();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
            { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
          ]);
        },
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
        { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
      ]);

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-reconnect-1',
                workItemId: QuestWorkItemIdStub(),
                sessionId,
                chatProcessId: ProcessIdStub({ value: 'proc-reconnect' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'post-reconnect',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const expectedMap = new Map();
      expectedMap.set(sessionId, [
        {
          role: 'assistant',
          type: 'text',
          content: 'post-reconnect',
          uuid: entryUuid,
          timestamp: entryTs,
        },
      ]);

      expect(result.current.entriesBySession).toStrictEqual(expectedMap);
    });
  });

  describe('questId change', () => {
    it('VALID: {questId changes while mounted} => sends unsubscribe-quest then subscribe-quest for new id', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId1 = QuestIdStub({ value: 'quest-change-old' });
      const questId2 = QuestIdStub({ value: 'quest-change-new' });

      let activeQuestId = questId1;

      const { rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: activeQuestId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            { type: 'subscribe-quest', questId: 'quest-change-old' },
          ]);
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          activeQuestId = questId2;
          rerender();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            { type: 'subscribe-quest', questId: 'quest-change-old' },
            { type: 'unsubscribe-quest', questId: 'quest-change-old' },
            { type: 'subscribe-quest', questId: 'quest-change-new' },
          ]);
        },
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-change-old' },
        { type: 'unsubscribe-quest', questId: 'quest-change-old' },
        { type: 'subscribe-quest', questId: 'quest-change-new' },
      ]);
    });

    it('VALID: {followup sent, then questId changes} => followupEntries drops the previous quest optimistic entry', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId1 = QuestIdStub({ value: 'quest-followup-carry-old' });
      const questId2 = QuestIdStub({ value: 'quest-followup-carry-new' });
      const message = UserInputStub({ value: 'What did this quest change?' });
      proxy.setupFollowup({ chatProcessId: ProcessIdStub({ value: 'proc-followup-carry' }) });
      proxy.setupUuids({ uuids: ['00000000-0000-4000-8000-000000000601'] });
      proxy.setupTimestamps({ timestamps: ['2026-08-09T00:00:00.000Z'] });

      let activeQuestId = questId1;

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: activeQuestId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendFollowupMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      const beforeSwitch = result.current.followupEntries;

      testingLibraryActAdapter({
        callback: () => {
          activeQuestId = questId2;
          rerender();
        },
      });

      expect({ beforeSwitch, afterSwitch: result.current.followupEntries }).toStrictEqual({
        beforeSwitch: [
          {
            role: 'user',
            content: 'What did this quest change?',
            uuid: '00000000-0000-4000-8000-000000000601',
            timestamp: '2026-08-09T00:00:00.000Z',
          },
        ],
        afterSwitch: [],
      });
    });
  });

  describe('sendFollowupMessage', () => {
    it('VALID: {questId, message} => POSTs to questFollowup with body {message} and appends an optimistic user entry', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-post-1' });
      const message = UserInputStub({ value: 'Show me what changed' });
      const synthUuid = '00000000-0000-4000-8000-000000000301';
      const synthTs = '2026-08-09T00:00:00.000Z';
      proxy.setupFollowup({ chatProcessId: ProcessIdStub({ value: 'proc-followup-post' }) });
      proxy.setupUuids({ uuids: [synthUuid] });
      proxy.setupTimestamps({ timestamps: [synthTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendFollowupMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect({
        requestBody: proxy.getFollowupRequestBody(),
        followupEntries: result.current.followupEntries,
        isStreaming: result.current.isStreaming,
      }).toStrictEqual({
        requestBody: { message: 'Show me what changed' },
        followupEntries: [
          { role: 'user', content: 'Show me what changed', uuid: synthUuid, timestamp: synthTs },
        ],
        isStreaming: true,
      });
    });

    it('EMPTY: {questId: null} => is a no-op, no POST and no followup entries', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: null }),
      });

      testingLibraryActAdapter({
        callback: () => {
          result.current.sendFollowupMessage({ message: UserInputStub({ value: 'Hi' }) });
        },
      });

      expect({
        requestCount: proxy.getFollowupRequestCount(),
        followupEntries: result.current.followupEntries,
      }).toStrictEqual({ requestCount: 0, followupEntries: [] });
    });

    it('ERROR: {400 rejection body} => followupEntries carries the server rejection text verbatim', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-rejected-1' });
      const synthUuid = '00000000-0000-4000-8000-000000000302';
      const errorUuid = '00000000-0000-4000-8000-000000000303';
      const synthTs = '2026-08-09T00:00:01.000Z';
      const errorTs = '2026-08-09T00:00:02.000Z';
      proxy.setupFollowupRejected({
        error: 'Quest must be blocked, complete or merged for follow-up',
      });
      proxy.setupUuids({ uuids: [synthUuid, errorUuid] });
      proxy.setupTimestamps({ timestamps: [synthTs, errorTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendFollowupMessage({ message: UserInputStub({ value: 'Any updates?' }) });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect({
        followupEntries: result.current.followupEntries,
        isStreaming: result.current.isStreaming,
      }).toStrictEqual({
        followupEntries: [
          { role: 'user', content: 'Any updates?', uuid: synthUuid, timestamp: synthTs },
          {
            role: 'system',
            type: 'error',
            content: 'Quest must be blocked, complete or merged for follow-up',
            uuid: errorUuid,
            timestamp: errorTs,
          },
        ],
        isStreaming: false,
      });
    });

    it('ERROR: {spawn failure reason} => followupEntries names the reason rather than a bare empty transcript', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-spawn-fail-1' });
      const synthUuid = '00000000-0000-4000-8000-000000000304';
      const errorUuid = '00000000-0000-4000-8000-000000000305';
      const synthTs = '2026-08-09T00:00:03.000Z';
      const errorTs = '2026-08-09T00:00:04.000Z';
      // The exact catch-all default the real responder returns when starting the tavernkeeper
      // process itself throws — a distinct failure mode from the 400 status-check rejection above.
      proxy.setupFollowupRejected({ error: 'Failed to start follow-up chat' });
      proxy.setupUuids({ uuids: [synthUuid, errorUuid] });
      proxy.setupTimestamps({ timestamps: [synthTs, errorTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendFollowupMessage({
            message: UserInputStub({ value: 'Show me the feature' }),
          });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.followupEntries).toStrictEqual([
        { role: 'user', content: 'Show me the feature', uuid: synthUuid, timestamp: synthTs },
        {
          role: 'system',
          type: 'error',
          content: 'Failed to start follow-up chat',
          uuid: errorUuid,
          timestamp: errorTs,
        },
      ]);
    });

    it('VALID: {two sequential sends} => the second send appends rather than replacing the transcript', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-second-press-1' });
      const firstUuid = '00000000-0000-4000-8000-000000000306';
      const secondUuid = '00000000-0000-4000-8000-000000000307';
      const firstTs = '2026-08-09T00:00:05.000Z';
      const secondTs = '2026-08-09T00:00:06.000Z';
      proxy.setupFollowup({ chatProcessId: ProcessIdStub({ value: 'proc-followup-first' }) });
      proxy.setupUuids({ uuids: [firstUuid, secondUuid] });
      proxy.setupTimestamps({ timestamps: [firstTs, secondTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendFollowupMessage({
            message: UserInputStub({ value: 'First question' }),
          });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendFollowupMessage({
            message: UserInputStub({ value: 'Second question' }),
          });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.followupEntries).toStrictEqual([
        { role: 'user', content: 'First question', uuid: firstUuid, timestamp: firstTs },
        { role: 'user', content: 'Second question', uuid: secondUuid, timestamp: secondTs },
      ]);
    });
  });

  describe('followupEntries', () => {
    it('EMPTY: {quest with no tavernkeeper work item} => followupEntries is empty', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-no-workitem-1' });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        workItems: [WorkItemStub({ role: 'codeweaver' })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-followup-no-workitem-1', quest },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.followupEntries).toStrictEqual([]);
    });

    it('EMPTY: {tavernkeeper work item with no streamed entries yet} => followupEntries is empty', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-no-session-1' });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        workItems: [WorkItemStub({ role: 'tavernkeeper' })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-followup-no-session-1', quest },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.followupEntries).toStrictEqual([]);
    });

    it('VALID: {chat-output tagged with the tavernkeeper workItemId, no sessionId} => streams into followupEntries while the turn runs', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-stream-1' });
      const tavernkeeperSessionId = SessionIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        workItems: [WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId })],
      });
      const entryUuid = '00000000-0000-4000-8000-000000000401';
      const entryTs = '2026-08-09T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-followup-stream-1', quest },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
          // FollowupChatStartResponder's live chat-output payload carries workItemId but never
          // sessionId (sessionId there is "informational only" — routing is by questId+workItemId,
          // same convention chat-start-responder uses). Only chatHistoryReplayBroker's replay
          // payload adds sessionId. This fixture matches the real live-turn wire shape.
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-followup-stream-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-followup-stream' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'Here is what changed',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
        },
      });

      expect({
        followupEntries: result.current.followupEntries,
        isStreaming: result.current.isStreaming,
      }).toStrictEqual({
        followupEntries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'Here is what changed',
            uuid: entryUuid,
            timestamp: entryTs,
          },
        ],
        isStreaming: true,
      });
    });

    it('VALID: {chat-complete after tavernkeeper streaming} => isStreaming returns to false so the composer is live for the next turn', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-turn-end-1' });
      const tavernkeeperSessionId = SessionIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const quest = QuestStub({
        id: questId,
        status: 'blocked',
        workItems: [WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-followup-turn-end-1', quest },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-followup-turn-end-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-followup-turn-end' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'Working on it',
                    uuid: '00000000-0000-4000-8000-000000000402',
                    timestamp: '2026-08-09T00:00:00.000Z',
                  },
                ],
              },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
        },
      });
      const whileStreaming = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-followup-turn-end' }),
                exitCode: 0,
                sessionId: tavernkeeperSessionId,
              },
              timestamp: '2026-08-09T00:00:01.000Z',
            }),
          });
        },
      });

      expect({ whileStreaming, afterTurnEnded: result.current.isStreaming }).toStrictEqual({
        whileStreaming: true,
        afterTurnEnded: false,
      });
    });

    it('VALID: {quest status complete} => tavernkeeper streaming arms then clears same as any other status', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-complete-status-1' });
      const tavernkeeperSessionId = SessionIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        workItems: [WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-followup-complete-status-1', quest },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-followup-complete-status-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-followup-complete' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'All done',
                    uuid: '00000000-0000-4000-8000-000000000403',
                    timestamp: '2026-08-09T00:00:00.000Z',
                  },
                ],
              },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
        },
      });
      const whileStreaming = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-followup-complete' }),
                exitCode: 0,
                sessionId: tavernkeeperSessionId,
              },
              timestamp: '2026-08-09T00:00:01.000Z',
            }),
          });
        },
      });

      expect({ whileStreaming, afterComplete: result.current.isStreaming }).toStrictEqual({
        whileStreaming: true,
        afterComplete: false,
      });
    });

    it('VALID: {quest status merged} => tavernkeeper streaming arms then clears same as any other status', () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-merged-status-1' });
      const tavernkeeperSessionId = SessionIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const quest = QuestStub({
        id: questId,
        status: 'merged',
        workItems: [WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-followup-merged-status-1', quest },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-followup-merged-status-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-followup-merged' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'Merged and done',
                    uuid: '00000000-0000-4000-8000-000000000404',
                    timestamp: '2026-08-09T00:00:00.000Z',
                  },
                ],
              },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
        },
      });
      const whileStreaming = result.current.isStreaming;

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-followup-merged' }),
                exitCode: 0,
                sessionId: tavernkeeperSessionId,
              },
              timestamp: '2026-08-09T00:00:01.000Z',
            }),
          });
        },
      });

      expect({ whileStreaming, afterComplete: result.current.isStreaming }).toStrictEqual({
        whileStreaming: true,
        afterComplete: false,
      });
    });

    it('EDGE: {sendMessage vs sendFollowupMessage} => neither writes into the other transcript', async () => {
      const proxy = useQuestChatBindingProxy();
      proxy.setupConnectedChannel();
      const questId = QuestIdStub({ value: 'quest-followup-isolation-1' });
      const tavernkeeperSessionId = SessionIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const quest = QuestStub({
        id: questId,
        status: 'blocked',
        workItems: [WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId })],
      });
      const mainUuid = '00000000-0000-4000-8000-000000000501';
      const followupUuid = '00000000-0000-4000-8000-000000000502';
      const mainTs = '2026-08-09T00:00:00.000Z';
      const followupTs = '2026-08-09T00:00:01.000Z';
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-main-isolation' }) });
      proxy.setupFollowup({ chatProcessId: ProcessIdStub({ value: 'proc-followup-isolation' }) });
      proxy.setupUuids({ uuids: [mainUuid, followupUuid] });
      proxy.setupTimestamps({ timestamps: [mainTs, followupTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-followup-isolation-1', quest },
              timestamp: '2026-08-09T00:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({
            message: UserInputStub({ value: 'Main composer message' }),
          });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendFollowupMessage({
            message: UserInputStub({ value: 'Followup composer message' }),
          });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      const synthKey = '__no_session__' as ReturnType<typeof SessionIdStub>;
      const expectedMainMap = new Map();
      expectedMainMap.set(synthKey, [
        { role: 'user', content: 'Main composer message', uuid: mainUuid, timestamp: mainTs },
      ]);

      expect({
        entriesBySession: result.current.entriesBySession,
        followupEntries: result.current.followupEntries,
      }).toStrictEqual({
        entriesBySession: expectedMainMap,
        followupEntries: [
          {
            role: 'user',
            content: 'Followup composer message',
            uuid: followupUuid,
            timestamp: followupTs,
          },
        ],
      });
    });
  });
});
