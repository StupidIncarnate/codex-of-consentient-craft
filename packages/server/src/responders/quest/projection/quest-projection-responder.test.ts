import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { QuestProjectionStub } from '@dungeonmaster/shared/contracts/quest-projection/quest-projection.stub';

import { QuestProjectionResponderProxy } from './quest-projection-responder.proxy';

const VALID_QUEST_ID = '11111111-1111-4111-8111-111111111111';

describe('QuestProjectionResponder', () => {
  describe('valid params', () => {
    it('VALID: {questId} => returns 200 with the orchestrator projection verbatim', async () => {
      const proxy = QuestProjectionResponderProxy();
      const projection = QuestProjectionStub({ questId: VALID_QUEST_ID });
      proxy.setupProjection({ projection });

      const result = await proxy.callResponder({ params: { questId: VALID_QUEST_ID } });

      expect(result).toStrictEqual({ status: 200, data: projection });
    });
  });

  describe('invalid params', () => {
    it('INVALID: {questId missing} => returns 400 without calling the orchestrator', async () => {
      const proxy = QuestProjectionResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({ status: 400, data: { error: 'questId is required' } });
    });

    it('EMPTY: {questId: ""} => returns 400', async () => {
      const proxy = QuestProjectionResponderProxy();

      const result = await proxy.callResponder({ params: { questId: '' } });

      expect(result).toStrictEqual({ status: 400, data: { error: 'questId is required' } });
    });
  });

  describe('quest not found', () => {
    it('ERROR: {orchestrator throws an Error} => returns 404 carrying that error message', async () => {
      const proxy = QuestProjectionResponderProxy();
      proxy.setupQuestNotFound({
        message: 'Quest not found: 11111111-1111-4111-8111-111111111111',
      });

      const result = await proxy.callResponder({ params: { questId: VALID_QUEST_ID } });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'Quest not found: 11111111-1111-4111-8111-111111111111' },
      });
    });

    it('ERROR: {orchestrator throws an Error carrying a cause} => returns 404 with the cause unwound into the reason', async () => {
      const proxy = QuestProjectionResponderProxy();
      proxy.setupQuestNotFound({
        message: 'Quest with id "q-gone" not found in any guild',
        cause: FileMissingErrorStub({ path: '/home/user/.dungeonmaster/guilds/g1/quests/q-gone' }),
      });

      const result = await proxy.callResponder({ params: { questId: VALID_QUEST_ID } });

      expect(result).toStrictEqual({
        status: 404,
        data: {
          error:
            'Quest with id "q-gone" not found in any guild | cause: ENOENT: open \'/home/user/.dungeonmaster/guilds/g1/quests/q-gone\'',
        },
      });
    });
  });

  describe('quest load failure that is not a missing quest', () => {
    it('ERROR: {orchestrator fails with EACCES} => returns 500 carrying that reason, not 404', async () => {
      const proxy = QuestProjectionResponderProxy();
      proxy.setupQuestLoadFails({
        error: FsErrorStub({
          code: 'EACCES',
          syscall: 'open',
          path: '/home/user/.dungeonmaster/guilds/g1/quests/q-locked/quest.json',
        }),
      });

      const result = await proxy.callResponder({ params: { questId: VALID_QUEST_ID } });

      expect(result).toStrictEqual({
        status: 500,
        data: {
          error: "EACCES: open '/home/user/.dungeonmaster/guilds/g1/quests/q-locked/quest.json'",
        },
      });
    });
  });
});
