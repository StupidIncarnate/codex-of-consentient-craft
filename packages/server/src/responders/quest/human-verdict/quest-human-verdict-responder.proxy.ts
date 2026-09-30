import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { questHumanVerdictRecordBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/human-verdict-record/quest-human-verdict-record-broker.proxy';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { QuestHumanVerdictResponder } from './quest-human-verdict-responder';

// Matches HumanVerdictInputStub()'s own defaults, which every test in
// quest-human-verdict-responder.test.ts sends as the body — the responder hands the merged
// params+body straight to the broker, so the mocked address must match that default.
const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const UNIT_ID = 'motion-feels-smooth';
const OUTCOME = 'met';
const REASON = 'Watched the raid transition twice; it stutters on the third frame.';

export const QuestHumanVerdictResponderProxy = (): {
  setupSucceeds: () => void;
  setupThrows: (params: { message: string }) => void;
  callResponder: typeof QuestHumanVerdictResponder;
} => {
  const verdictProxy = questHumanVerdictRecordBrokerProxy();

  return {
    setupSucceeds: (): void => {
      verdictProxy.setupResolves({
        input: { questId: QUEST_ID, unitId: UNIT_ID, outcome: OUTCOME, reason: REASON },
        quest: QuestStub(),
      });
    },
    setupThrows: ({ message }: { message: string }): void => {
      verdictProxy.setupRejects({
        input: { questId: QUEST_ID, unitId: UNIT_ID, outcome: OUTCOME, reason: REASON },
        error: new Error(message),
      });
    },
    callResponder: QuestHumanVerdictResponder,
  };
};
