import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { QuestRiftcarverDetailResponder } from './quest-riftcarver-detail-responder';

const DETAIL_RIFTCARVER_RESULT_ID = '22222222-2222-4222-8222-222222222222';
const LOG_FILE_PATH_VALUE = `/home/testuser/quest/riftcarver-results/${DETAIL_RIFTCARVER_RESULT_ID}.log`;
const LOG_FILE_PATH = LOG_FILE_PATH_VALUE;
// Matches the literal VALID_QUEST_ID used by every test in quest-riftcarver-detail-responder.test.ts —
// the responder passes params.questId straight through, so the mocked address must match it.
const DETAIL_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

export const QuestRiftcarverDetailResponderProxy = (): {
  setupDetail: (params: { contents: string }) => void;
  setupNotFound: () => void;
  callResponder: typeof QuestRiftcarverDetailResponder;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const readProxy = readFileProxy();

  const setupPaths = (): void => {
    findQuestPathProxy.setupQuestPath({
      questId: DETAIL_QUEST_ID,
      questPath: '/home/testuser/quest',
      guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
    });
    joinHandle
      .calledWith([
        '/home/testuser/quest',
        locationsStatics.quest.riftcarverResultsDir,
        `${DETAIL_RIFTCARVER_RESULT_ID}.log`,
      ])
      .returns(LOG_FILE_PATH_VALUE);
  };

  return {
    setupDetail: ({ contents }: { contents: string }): void => {
      setupPaths();
      readProxy.returns({ path: LOG_FILE_PATH, contents });
    },
    setupNotFound: (): void => {
      setupPaths();
      // readFileProxy's throwsMatchingPath demands an FsError (a coded, recorded failure — G19
      // bans a catch-all Error) — this file's own test asserts the exact message text below, so
      // it is built directly rather than through the differently-worded `missing()` scenario.
      readProxy.throwsMatchingPath({
        path: LOG_FILE_PATH,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
    callResponder: QuestRiftcarverDetailResponder,
  };
};
