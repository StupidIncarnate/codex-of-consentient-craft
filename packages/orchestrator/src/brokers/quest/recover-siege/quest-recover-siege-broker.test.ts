import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { questRecoverSiegeBroker } from './quest-recover-siege-broker';
import { questRecoverSiegeBrokerProxy } from './quest-recover-siege-broker.proxy';

const SIEGE_ID = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
const LAW_ID = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
const QUEST_ID = QuestIdStub({ value: 'nested-render' });

describe('questRecoverSiegeBroker', () => {
  describe('budget remaining => RECOVER', () => {
    it('VALID: {siege failed, attempt 0/3} => splices spiritmender + ward(changed) + fresh siege, quest stays in_progress', async () => {
      const proxy = questRecoverSiegeBrokerProxy();
      const siegeItem = WorkItemStub({
        id: SIEGE_ID,
        role: 'siegemaster',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
        relatedDataItems: ['flows/nested-subagent-rendering'],
      });
      const lawItem = WorkItemStub({
        id: LAW_ID,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [SIEGE_ID],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        status: 'in_progress',
        workItems: [siegeItem, lawItem],
      });
      proxy.setupRecover({ quest });
      const finding = WorkItemStub({
        summary: 'FLOW: nested\nFAILED OBSERVABLES:\n- x: 1 vs 0',
      }).summary;

      const result = await questRecoverSiegeBroker({
        questId: QUEST_ID,
        failedWorkItemId: SIEGE_ID,
        finding,
      });

      const persisted = proxy.getFinalPersistedWorkItems();
      const spliced = persisted.filter((wi) => wi.insertedBy === SIEGE_ID);
      const spiritmender = spliced.find((wi) => wi.role === 'spiritmender');
      const ward = spliced.find((wi) => wi.role === 'ward');
      const newSiege = spliced.find((wi) => wi.role === 'siegemaster');
      const law = persisted.find((wi) => wi.id === LAW_ID);

      expect({
        recovered: result.recovered,
        status: proxy.getFinalPersistedQuestStatus(),
        spiritmenderDependsOn: spiritmender?.dependsOn,
        wardDependsOn: ward?.dependsOn,
        wardMode: ward?.wardMode,
        newSiegeDependsOn: newSiege?.dependsOn,
        newSiegeAttempt: newSiege?.attempt,
        newSiegeRelatedDataItems: newSiege?.relatedDataItems,
        lawRewiredOntoRetry: law?.dependsOn,
      }).toStrictEqual({
        recovered: true,
        status: 'in_progress',
        spiritmenderDependsOn: [SIEGE_ID],
        wardDependsOn: [spiritmender?.id],
        wardMode: 'changed',
        newSiegeDependsOn: [ward?.id],
        newSiegeAttempt: 1,
        newSiegeRelatedDataItems: ['flows/nested-subagent-rendering'],
        lawRewiredOntoRetry: [newSiege?.id],
      });
    });

    it('VALID: {finding provided} => writes a sidecar carrying the finding + siegemasterFailure context', async () => {
      const proxy = questRecoverSiegeBrokerProxy();
      const siegeItem = WorkItemStub({
        id: SIEGE_ID,
        role: 'siegemaster',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
        relatedDataItems: ['flows/nested-subagent-rendering'],
      });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [siegeItem] });
      proxy.setupRecover({ quest });
      const findingText = 'FLOW: nested\nFAILED OBSERVABLES:\n- x: 1 vs 0';
      const finding = WorkItemStub({ summary: findingText }).summary;

      await questRecoverSiegeBroker({ questId: QUEST_ID, failedWorkItemId: SIEGE_ID, finding });

      const written = proxy.getWrittenSidecarContents();
      const parsed: unknown = JSON.parse(String(written));

      expect(parsed).toStrictEqual({
        filePaths: [],
        errors: [findingText],
        verificationCommand: 'npm run ward -- -- <the files you fixed>',
        contextInstructions: spiritmenderContextStatics.siegemasterFailure.instructions,
      });
    });

    it('EMPTY: {no finding} => sidecar errors carry the fallback investigate-and-fix message', async () => {
      const proxy = questRecoverSiegeBrokerProxy();
      const siegeItem = WorkItemStub({
        id: SIEGE_ID,
        role: 'siegemaster',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [siegeItem] });
      proxy.setupRecover({ quest });

      await questRecoverSiegeBroker({ questId: QUEST_ID, failedWorkItemId: SIEGE_ID });

      const written = proxy.getWrittenSidecarContents();
      const parsed: unknown = JSON.parse(String(written));

      expect(parsed).toStrictEqual({
        filePaths: [],
        errors: [
          'Siegemaster manual QA failed without a finding summary — re-run the flow by hand, reproduce the break (or false-positive green test), and fix the root cause.',
        ],
        verificationCommand: 'npm run ward -- -- <the files you fixed>',
        contextInstructions: spiritmenderContextStatics.siegemasterFailure.instructions,
      });
    });
  });

  describe('budget exhausted => BLOCK', () => {
    it('VALID: {siege failed, attempt 2/3} => blocks the quest, drains pending to skipped, no splice', async () => {
      const proxy = questRecoverSiegeBrokerProxy();
      const siegeItem = WorkItemStub({
        id: SIEGE_ID,
        role: 'siegemaster',
        status: 'failed',
        attempt: 2,
        maxAttempts: 3,
      });
      const lawItem = WorkItemStub({
        id: LAW_ID,
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [SIEGE_ID],
      });
      const quest = QuestStub({
        id: QUEST_ID,
        status: 'in_progress',
        workItems: [siegeItem, lawItem],
      });
      proxy.setupExhausted({ quest });

      const result = await questRecoverSiegeBroker({
        questId: QUEST_ID,
        failedWorkItemId: SIEGE_ID,
      });

      const persisted = proxy.getFinalPersistedWorkItems();

      expect({
        recovered: result.recovered,
        status: proxy.getFinalPersistedQuestStatus(),
        lawStatus: persisted.find((wi) => wi.id === LAW_ID)?.status,
        splicedCount: persisted.filter((wi) => wi.insertedBy === SIEGE_ID).length,
      }).toStrictEqual({
        recovered: false,
        status: 'blocked',
        lawStatus: 'skipped',
        splicedCount: 0,
      });
    });
  });

  describe('idempotency & edges', () => {
    it('EDGE: {a recovery already inserted by this siege} => no-op, returns recovered true', async () => {
      const proxy = questRecoverSiegeBrokerProxy();
      const siegeItem = WorkItemStub({
        id: SIEGE_ID,
        role: 'siegemaster',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
      });
      const priorSpiritmender = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-8e1f-3a4b5c6d7e8f' }),
        role: 'spiritmender',
        status: 'pending',
        insertedBy: SIEGE_ID,
      });
      const quest = QuestStub({
        id: QUEST_ID,
        status: 'in_progress',
        workItems: [siegeItem, priorSpiritmender],
      });
      proxy.setupRecover({ quest });

      const result = await questRecoverSiegeBroker({
        questId: QUEST_ID,
        failedWorkItemId: SIEGE_ID,
      });

      expect(result).toStrictEqual({ recovered: true });
    });

    it('EDGE: {failed work item not on quest} => returns recovered false', async () => {
      const proxy = questRecoverSiegeBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [] });
      proxy.setupRecover({ quest });

      const result = await questRecoverSiegeBroker({
        questId: QUEST_ID,
        failedWorkItemId: SIEGE_ID,
      });

      expect(result).toStrictEqual({ recovered: false });
    });
  });
});
