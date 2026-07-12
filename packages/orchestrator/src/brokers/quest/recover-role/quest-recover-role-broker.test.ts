import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { questRecoverRoleBroker } from './quest-recover-role-broker';
import { questRecoverRoleBrokerProxy } from './quest-recover-role-broker.proxy';

const FAILED_ID = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
const DOWNSTREAM_ID = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
const QUEST_ID = QuestIdStub({ value: 'nested-render' });

describe('questRecoverRoleBroker', () => {
  describe('budget remaining => RECOVER (spiritmender + ward + fresh role)', () => {
    it.each(['codeweaver', 'flowrider', 'lawbringer', 'blightwarden', 'siegemaster'] as const)(
      'VALID: {role: %s failed, attempt 0/3} => splices spiritmender + ward(changed) + a fresh %s, rewires downstream, quest stays in_progress',
      async (role) => {
        const proxy = questRecoverRoleBrokerProxy();
        const failedItem = WorkItemStub({
          id: FAILED_ID,
          role,
          status: 'failed',
          attempt: 0,
          maxAttempts: 3,
          relatedDataItems: ['steps/slice-x'],
        });
        const downstreamItem = WorkItemStub({
          id: DOWNSTREAM_ID,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          dependsOn: [FAILED_ID],
          wardMode: 'full',
        });
        const quest = QuestStub({
          id: QUEST_ID,
          status: 'in_progress',
          workItems: [failedItem, downstreamItem],
        });
        proxy.setupRecover({ quest });
        const finding = WorkItemStub({ summary: `${role} could not build its slice` }).summary;

        const result = await questRecoverRoleBroker({
          questId: QUEST_ID,
          failedWorkItemId: FAILED_ID,
          finding,
        });

        const persisted = proxy.getFinalPersistedWorkItems();
        const spliced = persisted.filter((wi) => wi.insertedBy === FAILED_ID);
        const spiritmender = spliced.find((wi) => wi.role === 'spiritmender');
        const ward = spliced.find((wi) => wi.role === 'ward');
        const fresh = spliced.find((wi) => wi.role === role);
        const downstream = persisted.find((wi) => wi.id === DOWNSTREAM_ID);

        expect({
          recovered: result.recovered,
          replanned: result.replanned,
          blocked: result.blocked,
          status: proxy.getFinalPersistedQuestStatus(),
          spiritmenderDependsOn: spiritmender?.dependsOn,
          wardMode: ward?.wardMode,
          wardDependsOn: ward?.dependsOn,
          freshRole: fresh?.role,
          freshDependsOn: fresh?.dependsOn,
          freshAttempt: fresh?.attempt,
          freshRelatedDataItems: fresh?.relatedDataItems,
          downstreamRewiredOntoFresh: downstream?.dependsOn,
        }).toStrictEqual({
          recovered: true,
          replanned: false,
          blocked: false,
          status: 'in_progress',
          spiritmenderDependsOn: [FAILED_ID],
          wardMode: 'changed',
          wardDependsOn: [spiritmender?.id],
          freshRole: role,
          freshDependsOn: [ward?.id],
          freshAttempt: 1,
          freshRelatedDataItems: ['steps/slice-x'],
          downstreamRewiredOntoFresh: [fresh?.id],
        });
      },
    );

    it('VALID: {codeweaver finding} => sidecar carries the finding + the generic roleFailure context', async () => {
      const proxy = questRecoverRoleBrokerProxy();
      const failedItem = WorkItemStub({
        id: FAILED_ID,
        role: 'codeweaver',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [failedItem] });
      proxy.setupRecover({ quest });
      const findingText = 'CLI slice needs ink; not installed';
      const finding = WorkItemStub({ summary: findingText }).summary;

      await questRecoverRoleBroker({ questId: QUEST_ID, failedWorkItemId: FAILED_ID, finding });

      const parsed: unknown = JSON.parse(String(proxy.getWrittenSidecarContents()));

      expect(parsed).toStrictEqual({
        filePaths: [],
        errors: [findingText],
        verificationCommand: 'npm run ward -- -- <the files you fixed>',
        contextInstructions: spiritmenderContextStatics.roleFailure.instructions,
      });
    });

    it('VALID: {siegemaster finding} => sidecar keeps the siegemasterFailure context (manual-QA preserved)', async () => {
      const proxy = questRecoverRoleBrokerProxy();
      const failedItem = WorkItemStub({
        id: FAILED_ID,
        role: 'siegemaster',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
        relatedDataItems: ['flows/login-flow'],
      });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [failedItem] });
      proxy.setupRecover({ quest });
      const finding = WorkItemStub({ summary: 'FLOW broken: dashboard vs error toast' }).summary;

      await questRecoverRoleBroker({ questId: QUEST_ID, failedWorkItemId: FAILED_ID, finding });

      const parsed: unknown = JSON.parse(String(proxy.getWrittenSidecarContents()));

      expect(parsed).toStrictEqual({
        filePaths: [],
        errors: ['FLOW broken: dashboard vs error toast'],
        verificationCommand: 'npm run ward -- -- <the files you fixed>',
        contextInstructions: spiritmenderContextStatics.siegemasterFailure.instructions,
      });
    });

    it('EMPTY: {no finding} => sidecar errors carry the fallback investigate-and-fix message', async () => {
      const proxy = questRecoverRoleBrokerProxy();
      const failedItem = WorkItemStub({
        id: FAILED_ID,
        role: 'codeweaver',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [failedItem] });
      proxy.setupRecover({ quest });

      await questRecoverRoleBroker({ questId: QUEST_ID, failedWorkItemId: FAILED_ID });

      const parsed: unknown = JSON.parse(String(proxy.getWrittenSidecarContents()));

      expect(parsed).toStrictEqual({
        filePaths: [],
        errors: [
          'The agent reported a code failure without a finding summary — investigate the failure, reproduce it, fix the root cause, and ward-verify the files you touched.',
        ],
        verificationCommand: 'npm run ward -- -- <the files you fixed>',
        contextInstructions: spiritmenderContextStatics.roleFailure.instructions,
      });
    });
  });

  describe('budget exhausted => escalate to PathSeeker replan (NEVER blocks directly)', () => {
    it('VALID: {codeweaver failed, attempt 2/3} => delegates to the replan splice, no recovery splice', async () => {
      const proxy = questRecoverRoleBrokerProxy();
      const failedItem = WorkItemStub({
        id: FAILED_ID,
        role: 'codeweaver',
        status: 'failed',
        attempt: 2,
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [failedItem] });
      proxy.setupExhaustedReplan({ quest });

      const result = await questRecoverRoleBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      expect({
        result,
        splicedCount: proxy.getFinalPersistedWorkItems().length,
      }).toStrictEqual({
        result: { recovered: false, replanned: true, blocked: false },
        splicedCount: 0,
      });
    });

    it('VALID: {codeweaver failed, attempt 2/3, replan loop also spent} => escalation blocks', async () => {
      const proxy = questRecoverRoleBrokerProxy();
      const failedItem = WorkItemStub({
        id: FAILED_ID,
        role: 'codeweaver',
        status: 'failed',
        attempt: 2,
        maxAttempts: 3,
      });
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [failedItem] });
      proxy.setupExhaustedBlock({ quest });

      const result = await questRecoverRoleBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      expect(result).toStrictEqual({ recovered: false, replanned: false, blocked: true });
    });
  });

  describe('idempotency & edges', () => {
    it('EDGE: {a recovery already inserted by this item} => no-op, returns recovered true', async () => {
      const proxy = questRecoverRoleBrokerProxy();
      const failedItem = WorkItemStub({
        id: FAILED_ID,
        role: 'codeweaver',
        status: 'failed',
        attempt: 0,
        maxAttempts: 3,
      });
      const priorSpiritmender = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-8e1f-3a4b5c6d7e8f' }),
        role: 'spiritmender',
        status: 'pending',
        insertedBy: FAILED_ID,
      });
      const quest = QuestStub({
        id: QUEST_ID,
        status: 'in_progress',
        workItems: [failedItem, priorSpiritmender],
      });
      proxy.setupRecover({ quest });

      const result = await questRecoverRoleBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      expect(result).toStrictEqual({ recovered: true, replanned: false, blocked: false });
    });

    it('EDGE: {failed work item not on quest} => returns recovered false', async () => {
      const proxy = questRecoverRoleBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID, status: 'in_progress', workItems: [] });
      proxy.setupRecover({ quest });

      const result = await questRecoverRoleBroker({
        questId: QUEST_ID,
        failedWorkItemId: FAILED_ID,
      });

      expect(result).toStrictEqual({ recovered: false, replanned: false, blocked: false });
    });
  });
});
