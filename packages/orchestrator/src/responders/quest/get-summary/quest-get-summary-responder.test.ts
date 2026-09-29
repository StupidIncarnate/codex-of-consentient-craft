import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { QuestNoteStub } from '@dungeonmaster/shared/contracts/quest-note/quest-note.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questSummaryBuildTransformer } from '../../../transformers/quest-summary-build/quest-summary-build-transformer';
import { QuestGetSummaryResponderProxy } from './quest-get-summary-responder.proxy';

describe('QuestGetSummaryResponder', () => {
  describe('returning a summary', () => {
    it('VALID: {known questId} => returns the structured summary, not text', async () => {
      const proxy = QuestGetSummaryResponderProxy();
      const quest = QuestStub({
        flows: [FlowStub({ id: 'first-flow', name: 'First Flow', nodes: [], edges: [] })],
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual(questSummaryBuildTransformer({ quest }));
    });

    it('VALID: {quest with drift and notes} => both are reported alongside the coverage', async () => {
      const proxy = QuestGetSummaryResponderProxy();
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
          blightLedger: [],
          questNotes: [QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' })],
          operationPlans: [],
        },
      });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result.noteGroups).toStrictEqual([
        {
          id: 'open-question',
          notes: [QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' })],
        },
        { id: 'tooling-error', notes: [] },
        { id: 'out-of-scope', notes: [] },
        { id: 'walk-reset', notes: [] },
        { id: 'walked', notes: [] },
        { id: 'human-verdict', notes: [] },
      ]);
    });

    it('EMPTY: {quest with no flows} => returns an empty coverage list', async () => {
      const proxy = QuestGetSummaryResponderProxy();
      const quest = QuestStub({ id: 'add-auth', flows: [] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result.flows).toStrictEqual([]);
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {questId: ""} => throws before any load is attempted', async () => {
      const proxy = QuestGetSummaryResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId: '' })).rejects.toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('ERROR: {unknown questId} => propagates the broker throw', async () => {
      const proxy = QuestGetSummaryResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId: 'no-such-quest' })).rejects.toThrow(
        /no-such-quest/u,
      );
    });
  });
});
