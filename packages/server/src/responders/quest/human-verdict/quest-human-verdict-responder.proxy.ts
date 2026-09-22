import { questHumanVerdictRecordBroker } from '@dungeonmaster/orchestrator/brokers';
import { questHumanVerdictRecordBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { QuestHumanVerdictResponder } from './quest-human-verdict-responder';

// Matches HumanVerdictInputStub()'s own defaults, which every test in
// quest-human-verdict-responder.test.ts sends as the body — the responder hands the merged
// params+body straight to the broker, so the mocked address must match that default.
const QUEST_ID = 'add-auth';
const UNIT_ID = 'motion-feels-smooth';
const OUTCOME = 'met';
const REASON = 'Watched run_7/walk.webm end to end — the transition never stutters.';

export const QuestHumanVerdictResponderProxy = (): {
  setupSucceeds: () => void;
  setupThrows: (params: { message: string }) => void;
  callResponder: typeof QuestHumanVerdictResponder;
} => {
  // Composed only to satisfy enforce-proxy-child-creation — this responder's own registerMock
  // below fully replaces questHumanVerdictRecordBroker, so nothing this child proxy stages is
  // reachable through it.
  questHumanVerdictRecordBrokerProxy();
  const handle = registerMock({ fn: questHumanVerdictRecordBroker });

  return {
    setupSucceeds: (): void => {
      handle
        .calledWith([{ questId: QUEST_ID, unitId: UNIT_ID, outcome: OUTCOME, reason: REASON }])
        .resolves({ quest: QuestStub() });
    },
    setupThrows: ({ message }: { message: string }): void => {
      handle
        .calledWith([{ questId: QUEST_ID, unitId: UNIT_ID, outcome: OUTCOME, reason: REASON }])
        .rejects(new Error(message));
    },
    callResponder: QuestHumanVerdictResponder,
  };
};
