import {
  CommentBatchEntryStub,
  FlowStub,
  ObservableIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { CommentBatchResponder } from './comment-batch-responder';
import { CommentBatchResponderProxy } from './comment-batch-responder.proxy';

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const CUSTOM_CREATED_AT = '2024-02-20T08:30:00.000Z';

const NODE_COMMENT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const OBSERVABLE_COMMENT_ID = 'a1a1a1a1-58cc-4372-a567-0e02b2c3d479';
const CARRIED_CREATED_AT_ID = 'b2b2b2b2-58cc-4372-a567-0e02b2c3d479';
const FIRST_BATCH_ID = 'c3c3c3c3-58cc-4372-a567-0e02b2c3d479';
const SECOND_BATCH_ID = 'd4d4d4d4-58cc-4372-a567-0e02b2c3d479';

describe('CommentBatchResponder', () => {
  describe('minting and persisting', () => {
    it('VALID: {one node comment, no observableId, no createdAt} => mints id + createdAt, persists via questModifyBroker, returns comments and flows', async () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const proxy = CommentBatchResponderProxy();
      proxy.setupUuids({ ids: [NODE_COMMENT_ID] });
      proxy.setupPersistSucceeds();
      proxy.setupQuestFlows({ flows: quest.flows });

      const result = await CommentBatchResponder({
        questId: quest.id,
        comments: [CommentBatchEntryStub()],
      });

      expect(result).toStrictEqual({
        comments: [
          {
            id: NODE_COMMENT_ID,
            flowId: 'login-flow',
            nodeId: 'start',
            text: 'This assertion looks wrong',
            createdAt: FIXED_TIMESTAMP,
          },
        ],
        flows: quest.flows,
      });
      expect(proxy.getPersistedInputs()).toStrictEqual([
        {
          questId: quest.id,
          comments: [
            {
              id: NODE_COMMENT_ID,
              flowId: 'login-flow',
              nodeId: 'start',
              text: 'This assertion looks wrong',
              createdAt: FIXED_TIMESTAMP,
            },
          ],
        },
      ]);
    });

    it('VALID: {entry with observableId} => mints a comment carrying the observableId', async () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const proxy = CommentBatchResponderProxy();
      proxy.setupUuids({ ids: [OBSERVABLE_COMMENT_ID] });
      proxy.setupPersistSucceeds();
      proxy.setupQuestFlows({ flows: quest.flows });

      const observableId = ObservableIdStub();

      const result = await CommentBatchResponder({
        questId: quest.id,
        comments: [CommentBatchEntryStub({ observableId })],
      });

      expect(result.comments).toStrictEqual([
        {
          id: OBSERVABLE_COMMENT_ID,
          flowId: 'login-flow',
          nodeId: 'start',
          observableId: 'login-redirects-to-dashboard',
          text: 'This assertion looks wrong',
          createdAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {entry carrying its own createdAt} => carries createdAt through verbatim instead of minting one', async () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const proxy = CommentBatchResponderProxy();
      proxy.setupUuids({ ids: [CARRIED_CREATED_AT_ID] });
      proxy.setupPersistSucceeds();
      proxy.setupQuestFlows({ flows: quest.flows });

      const result = await CommentBatchResponder({
        questId: quest.id,
        comments: [CommentBatchEntryStub({ createdAt: CUSTOM_CREATED_AT as never })],
      });

      expect(result.comments).toStrictEqual([
        {
          id: CARRIED_CREATED_AT_ID,
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: CUSTOM_CREATED_AT,
        },
      ]);
    });

    it('VALID: {two comments in one batch} => mints one comment per entry with distinct ids in order', async () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const proxy = CommentBatchResponderProxy();
      proxy.setupUuids({ ids: [FIRST_BATCH_ID, SECOND_BATCH_ID] });
      proxy.setupPersistSucceeds();
      proxy.setupQuestFlows({ flows: quest.flows });

      const result = await CommentBatchResponder({
        questId: quest.id,
        comments: [
          CommentBatchEntryStub({ text: 'First comment' as never }),
          CommentBatchEntryStub({ text: 'Second comment' as never }),
        ],
      });

      expect(result.comments).toStrictEqual([
        {
          id: FIRST_BATCH_ID,
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'First comment',
          createdAt: FIXED_TIMESTAMP,
        },
        {
          id: SECOND_BATCH_ID,
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'Second comment',
          createdAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {two separate CommentBatchResponder calls} => each call mints a fresh id, never reusing the prior id', async () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const proxy = CommentBatchResponderProxy();
      proxy.setupUuids({ ids: [FIRST_BATCH_ID, SECOND_BATCH_ID] });
      proxy.setupPersistSucceeds();
      proxy.setupPersistSucceeds();
      proxy.setupQuestFlows({ flows: quest.flows });
      proxy.setupQuestFlows({ flows: quest.flows });

      const first = await CommentBatchResponder({
        questId: quest.id,
        comments: [CommentBatchEntryStub()],
      });
      const second = await CommentBatchResponder({
        questId: quest.id,
        comments: [CommentBatchEntryStub()],
      });

      expect(first.comments).toStrictEqual([
        {
          id: FIRST_BATCH_ID,
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: FIXED_TIMESTAMP,
        },
      ]);
      expect(second.comments).toStrictEqual([
        {
          id: SECOND_BATCH_ID,
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'This assertion looks wrong',
          createdAt: FIXED_TIMESTAMP,
        },
      ]);
    });
  });

  describe('persist failure', () => {
    it('ERROR: {questModifyBroker resolves success:false} => throws including the broker error, never reaching the quest read', async () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const proxy = CommentBatchResponderProxy();
      proxy.setupUuids({ ids: [NODE_COMMENT_ID] });
      proxy.setupPersistFails({ error: 'Save invariants failed' });

      await expect(
        CommentBatchResponder({ questId: quest.id, comments: [CommentBatchEntryStub()] }),
      ).rejects.toThrow(/^Failed to persist comment batch: Save invariants failed$/u);
    });
  });

  describe('post-persist read failure', () => {
    it('ERROR: {questGetBroker fails after a successful persist} => throws including the read error', async () => {
      const quest = QuestStub({ flows: [FlowStub()] });
      const proxy = CommentBatchResponderProxy();
      proxy.setupUuids({ ids: [NODE_COMMENT_ID] });
      proxy.setupPersistSucceeds();
      proxy.setupQuestReadFails();

      await expect(
        CommentBatchResponder({ questId: quest.id, comments: [CommentBatchEntryStub()] }),
      ).rejects.toThrow(
        /^Failed to load quest after persisting comment batch: Quest with id "add-auth" not found in any guild$/u,
      );
    });
  });
});
