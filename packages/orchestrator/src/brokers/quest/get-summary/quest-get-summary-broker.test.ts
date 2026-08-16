import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

import { questSummaryBuildTransformer } from '../../../transformers/quest-summary-build/quest-summary-build-transformer';
import { questGetSummaryBroker } from './quest-get-summary-broker';
import { questGetSummaryBrokerProxy } from './quest-get-summary-broker.proxy';

describe('questGetSummaryBroker', () => {
  describe('summarising a quest', () => {
    it('VALID: {quest with two flows} => returns the summary the transformer computes for it', async () => {
      const proxy = questGetSummaryBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] }),
          FlowStub({ id: 'second-flow', name: 'Second Flow', nodes: [], edges: [] }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetSummaryBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result).toStrictEqual(questSummaryBuildTransformer({ quest }));
    });

    it('VALID: {signed and unsigned units} => the loaded quest drives the per-track counts', async () => {
      const proxy = questGetSummaryBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
                flowriderSignoff: SignoffStub(),
              }),
            ],
            edges: [
              FlowEdgeStub({
                id: 'e-success',
                from: 'login-page',
                to: 'dashboard',
                label: 'success',
              }),
            ],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetSummaryBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 1, unconfirmable: 0, outstanding: 1 },
            // This quest tags no `packagesAffected`, so no node's package kind resolves and the
            // two denominators over `flowriderSignoff` both still own every unit — the same
            // over-inclusion both their completion gates apply.
            { id: 'groundstomper', confirmed: 1, unconfirmable: 0, outstanding: 1 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
          ],
        },
      ]);
    });

    it('VALID: {mid-quest observable and a note} => both survive the load', async () => {
      const proxy = questGetSummaryBrokerProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'crash-on-bleh',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 400 for a non-JSON body',
                    addedBy: 'siegemaster',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
        planningNotes: {
          blightReports: [],
          qaLedger: [],
          blightLedger: [],
          questNotes: [QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' })],
          operationPlans: [],
        },
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetSummaryBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.midQuestObservables).toStrictEqual([
        {
          id: 'login-flow:observable:crash-on-bleh',
          flowId: 'login-flow',
          nodeId: 'login-page',
          observableId: 'crash-on-bleh',
          addedBy: 'siegemaster',
          observableType: 'api-call',
          description: 'POST /api/auth/login returns 400 for a non-JSON body',
        },
      ]);
    });

    it('EMPTY: {quest with no flows} => returns an empty coverage list with the note skeleton', async () => {
      const proxy = questGetSummaryBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', flows: [] });
      proxy.setupQuestFound({ quest });

      const result = await questGetSummaryBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result).toStrictEqual({
        questId: 'add-auth',
        flows: [],
        midQuestObservables: [],
        unconfirmable: [],
        noteGroups: [
          { id: 'open-question', notes: [] },
          { id: 'tooling-error', notes: [] },
          { id: 'out-of-scope', notes: [] },
          { id: 'walk-reset', notes: [] },
        ],
      });
    });
  });

  describe('quest not found', () => {
    it('ERROR: {unknown questId} => throws rather than returning an empty summary', async () => {
      const proxy = questGetSummaryBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questGetSummaryBroker({ questId: QuestIdStub({ value: 'no-such-quest' }) }),
      ).rejects.toThrow(/no-such-quest/u);
    });
  });
});
