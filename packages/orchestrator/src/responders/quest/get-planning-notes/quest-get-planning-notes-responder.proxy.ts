/**
 * PURPOSE: Proxy for QuestGetPlanningNotesResponder. Delegates to broker proxy for quest-load/find mocks.
 *
 * USAGE:
 * const proxy = QuestGetPlanningNotesResponderProxy();
 * proxy.setupQuestFound({ quest });
 * const result = await proxy.callResponder({ questId: 'add-auth' });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetPlanningNotesBrokerProxy } from '../../../brokers/quest/get-planning-notes/quest-get-planning-notes-broker.proxy';
import { QuestGetPlanningNotesResponder } from './quest-get-planning-notes-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestGetPlanningNotesResponderProxy = (): {
  callResponder: typeof QuestGetPlanningNotesResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const brokerProxy = questGetPlanningNotesBrokerProxy();

  return {
    callResponder: QuestGetPlanningNotesResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      brokerProxy.setupQuestNotFound();
    },
  };
};
