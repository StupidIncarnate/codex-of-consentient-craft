import {
  ContentTextStub,
  ExitCodeStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { CleanupAnswerStub } from '../../../contracts/cleanup-answer/cleanup-answer.stub';
import { stepHandlerCleanupBroker } from './step-handler-cleanup-broker';
import { stepHandlerCleanupBrokerProxy } from './step-handler-cleanup-broker.proxy';

type ContentText = ReturnType<typeof ContentTextStub>;

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

describe('stepHandlerCleanupBroker', () => {
  describe('a cleanup answer with every field at zero', () => {
    it('EMPTY: {exit 0, everything at zero} => classifies empty', async () => {
      const proxy = stepHandlerCleanupBrokerProxy();
      proxy.cleanupExits({
        exitCode: ExitCodeStub({ value: 0 }),
        answer: CleanupAnswerStub(),
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
        exitCode: ExitCodeStub({ value: 0 }),
        answer: CleanupAnswerStub({ reaped: [{ id: 'inst_9b2c' }] }),
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
      proxy.cleanupFails({ exitCode: ExitCodeStub({ value: 1 }), output: 'driver crashed' });

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
      proxy.cleanupExits({ exitCode: ExitCodeStub({ value: 0 }), answer: CleanupAnswerStub() });

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
      proxy.cleanupExits({ exitCode: ExitCodeStub({ value: 0 }), answer: CleanupAnswerStub() });

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
        exitCode: ExitCodeStub({ value: 0 }),
        answer: CleanupAnswerStub({ lockReleased: true }),
      });
      const seenLines: ContentText[] = [];

      await stepHandlerCleanupBroker({
        args: [],
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        onLine: (line) => seenLines.push(ContentTextStub({ value: line })),
      });

      expect(seenLines.length).toBeGreaterThan(0);
    });
  });
});
