import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestNoteStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questHumanVerdictRecordBroker } from './quest-human-verdict-record-broker';
import { questHumanVerdictRecordBrokerProxy } from './quest-human-verdict-record-broker.proxy';

describe('questHumanVerdictRecordBroker', () => {
  describe('recording a fresh verdict', () => {
    it("VALID: {outcome: met} => persists a human-verdict note carrying the observable's flowId, a confirmed summary and the reason as detail, and stamps updatedAt", async () => {
      const proxy = questHumanVerdictRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [
                  FlowObservableStub({
                    id: 'motion-feels-smooth',
                    description: 'the transition feels smooth',
                    verifyByHuman: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questHumanVerdictRecordBroker({
        questId: 'add-auth',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        reason: 'Watched run_7/walk.webm end to end — the transition never stutters.',
      });

      const persisted = proxy.getLastPersistedQuest();

      expect(result).toStrictEqual({ quest: persisted });
      expect({
        questNotes: persisted.planningNotes.questNotes,
        updatedAt: persisted.updatedAt,
      }).toStrictEqual({
        questNotes: [
          {
            id: 'human-verdict-motion-feels-smooth',
            kind: 'human-verdict',
            role: 'operator',
            workItemId: '00000000-0000-0000-0000-000000000000',
            flowId: 'login-flow',
            unitId: 'motion-feels-smooth',
            outcome: 'met',
            summary: 'the transition feels smooth: confirmed',
            detail: 'Watched run_7/walk.webm end to end — the transition never stutters.',
            at: '2024-01-15T10:00:00.000Z',
          },
        ],
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {outcome: not-met} => persists a rejected summary', async () => {
      const proxy = questHumanVerdictRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [
                  FlowObservableStub({
                    id: 'motion-feels-smooth',
                    description: 'the transition feels smooth',
                    verifyByHuman: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await questHumanVerdictRecordBroker({
        questId: 'add-auth',
        unitId: 'motion-feels-smooth',
        outcome: 'not-met',
        reason: 'The panel jumps two pixels right before it settles — visibly janky.',
      });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.planningNotes.questNotes).toStrictEqual([
        {
          id: 'human-verdict-motion-feels-smooth',
          kind: 'human-verdict',
          role: 'operator',
          workItemId: '00000000-0000-0000-0000-000000000000',
          flowId: 'login-flow',
          unitId: 'motion-feels-smooth',
          outcome: 'not-met',
          summary: 'the transition feels smooth: rejected',
          detail: 'The panel jumps two pixels right before it settles — visibly janky.',
          at: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });

    it('VALID: {several observables on the node, only one matching unitId} => selects exactly that observable, never an earlier sibling', async () => {
      const proxy = questHumanVerdictRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [
                  FlowObservableStub({
                    id: 'some-other-criterion',
                    description: 'some other criterion entirely',
                    verifyByHuman: true,
                  }),
                  FlowObservableStub({
                    id: 'motion-feels-smooth',
                    description: 'the transition feels smooth',
                    verifyByHuman: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await questHumanVerdictRecordBroker({
        questId: 'add-auth',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        reason: 'Watched it end to end.',
      });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.planningNotes.questNotes).toStrictEqual([
        {
          id: 'human-verdict-motion-feels-smooth',
          kind: 'human-verdict',
          role: 'operator',
          workItemId: '00000000-0000-0000-0000-000000000000',
          flowId: 'login-flow',
          unitId: 'motion-feels-smooth',
          outcome: 'met',
          summary: 'the transition feels smooth: confirmed',
          detail: 'Watched it end to end.',
          at: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('a second verdict on the same unit', () => {
    it('VALID: {a prior human-verdict note for the same unitId} => REPLACES it — one entry survives, carrying the new outcome and detail', async () => {
      const proxy = questHumanVerdictRecordBrokerProxy();
      const priorNote = QuestNoteStub({
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        workItemId: '00000000-0000-0000-0000-000000000000',
        flowId: 'login-flow',
        unitId: 'motion-feels-smooth',
        outcome: 'not-met',
        summary: 'the transition feels smooth: rejected',
        detail: 'First look — seemed janky.',
        at: '2024-01-15T09:00:00.000Z',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [
                  FlowObservableStub({
                    id: 'motion-feels-smooth',
                    description: 'the transition feels smooth',
                    verifyByHuman: true,
                  }),
                ],
              }),
            ],
          }),
        ],
        planningNotes: { blightLedger: [], questNotes: [priorNote], operationPlans: [] },
      });
      proxy.setupQuestFound({ quest });

      await questHumanVerdictRecordBroker({
        questId: 'add-auth',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        reason: 'Second look — motion is smooth now.',
      });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.planningNotes.questNotes).toStrictEqual([
        {
          id: 'human-verdict-motion-feels-smooth',
          kind: 'human-verdict',
          role: 'operator',
          workItemId: '00000000-0000-0000-0000-000000000000',
          flowId: 'login-flow',
          unitId: 'motion-feels-smooth',
          outcome: 'met',
          summary: 'the transition feels smooth: confirmed',
          detail: 'Second look — motion is smooth now.',
          at: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('an observable this quest does not carry', () => {
    it('ERROR: {unitId names no observable on the quest} => throws naming the quest and the unitId, and persists nothing', async () => {
      const proxy = questHumanVerdictRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', observables: [] })],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await expect(
        questHumanVerdictRecordBroker({
          questId: 'add-auth',
          unitId: 'motion-feels-smooth',
          outcome: 'met',
          reason: 'Watched it.',
        }),
      ).rejects.toThrow(/Quest add-auth has no observable named "motion-feels-smooth"\./u);

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('an observable without verifyByHuman', () => {
    it('ERROR: {unitId names a real observable that carries no verifyByHuman flag} => refuses, and persists nothing', async () => {
      const proxy = questHumanVerdictRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [
                  FlowObservableStub({
                    id: 'check-login-api-called',
                    description: 'POST /api/auth/login called with credentials',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await expect(
        questHumanVerdictRecordBroker({
          questId: 'add-auth',
          unitId: 'check-login-api-called',
          outcome: 'met',
          reason: 'Watched it.',
        }),
      ).rejects.toThrow(
        /Observable "check-login-api-called" on quest add-auth is not flagged verifyByHuman/u,
      );

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });
});
