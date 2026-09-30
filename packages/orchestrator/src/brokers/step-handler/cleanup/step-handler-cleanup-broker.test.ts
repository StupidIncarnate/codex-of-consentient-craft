import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import { CleanupCliAnswerStub } from '../../../contracts/cleanup-cli-answer/cleanup-cli-answer.stub';
import { stepHandlerCleanupBroker } from './step-handler-cleanup-broker';
import { stepHandlerCleanupBrokerProxy } from './step-handler-cleanup-broker.proxy';

type ContentText = string;

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

describe('stepHandlerCleanupBroker', () => {
  describe('a cleanup answer with every field at zero', () => {
    it('EMPTY: {exit 0, everything at zero} => classifies empty', async () => {
      const proxy = stepHandlerCleanupBrokerProxy();
      proxy.cleanupExits({
        questId: QUEST_ID,
        exitCode: 0,
        answer: CleanupCliAnswerStub(),
      });

      const result = await stepHandlerCleanupBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('empty');
    });
  });

  describe('one reaped entry', () => {
    it('VALID: {exit 0, one reaped instance} => classifies done', async () => {
      const proxy = stepHandlerCleanupBrokerProxy();
      proxy.cleanupExits({
        questId: QUEST_ID,
        exitCode: 0,
        answer: CleanupCliAnswerStub({ reaped: [{ id: 'inst_9b2c' }] }),
      });

      const result = await stepHandlerCleanupBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('done');
    });
  });

  describe('a nonzero exit', () => {
    it('ERROR: {exit 1} => classifies wall', async () => {
      const proxy = stepHandlerCleanupBrokerProxy();
      proxy.cleanupFails({
        questId: QUEST_ID,
        exitCode: 1,
        output: 'driver crashed',
      });

      const result = await stepHandlerCleanupBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(result.outcome).toBe('wall');
    });
  });

  describe('the spawned call', () => {
    it('VALID: {any run} => spawns dungeonmaster siegelense cleanup --json', async () => {
      const proxy = stepHandlerCleanupBrokerProxy();
      proxy.cleanupExits({
        questId: QUEST_ID,
        exitCode: 0,
        answer: CleanupCliAnswerStub(),
      });

      await stepHandlerCleanupBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['siegelense', 'cleanup', '--json']);
    });

    it('VALID: {any run} => cwd is the quest repo root', async () => {
      const proxy = stepHandlerCleanupBrokerProxy();
      proxy.cleanupExits({
        questId: QUEST_ID,
        exitCode: 0,
        answer: CleanupCliAnswerStub(),
      });

      await stepHandlerCleanupBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: () => undefined,
      });

      expect(proxy.getSpawnedCwd()).toBe('/repo');
    });
  });

  describe('onLine streaming', () => {
    it('VALID: {cleanup output} => a line reaches the callback DURING the run', async () => {
      const proxy = stepHandlerCleanupBrokerProxy();
      proxy.cleanupExits({
        questId: QUEST_ID,
        exitCode: 0,
        answer: CleanupCliAnswerStub({ lockReleased: true }),
      });
      const seenLines: ContentText[] = [];

      await stepHandlerCleanupBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: (line) => seenLines.push(line),
      });

      expect(seenLines.length).toBeGreaterThan(0);
    });
  });
});
