import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestNoteStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

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

    it('VALID: {quest with an unconfirmable verdict} => the reason and the question come through', async () => {
      const proxy = QuestGetSummaryResponderProxy();
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
                flowriderSignoff: SignoffStub({
                  verdict: 'unconfirmable',
                  evidence: 'playwright.config.ts declares no webServer for this project',
                  question: 'Who owns adding a webServer block to playwright.config.ts?',
                }),
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

      const result = await proxy.callResponder({ questId: quest.id });

      // `flowriderSignoff` has exactly one reader now, so the unconfirmable verdict on it surfaces
      // as exactly one entry.
      expect(result.unconfirmable).toStrictEqual([
        {
          id: 'login-flow:terminal:dashboard:flowrider',
          unitId: 'login-flow:terminal:dashboard',
          flowId: 'login-flow',
          kind: 'terminal',
          track: 'flowrider',
          signoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'playwright.config.ts declares no webServer for this project',
            question: 'Who owns adding a webServer block to playwright.config.ts?',
          }),
        },
      ]);
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
        /String must contain at least 1 character/u,
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
