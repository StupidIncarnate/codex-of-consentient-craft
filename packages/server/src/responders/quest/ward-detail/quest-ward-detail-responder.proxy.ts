import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FilePathStub as SharedFilePathStub,
  GuildIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';
import { join } from '#gateway/node/path';
import { locationsWardResultsPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { QuestWardDetailResponder } from './quest-ward-detail-responder';

const DETAIL_WARD_RESULT_ID = '22222222-2222-4222-8222-222222222222';
const DETAIL_FILE_PATH_VALUE = `/home/testuser/quest/ward-results/${DETAIL_WARD_RESULT_ID}.json`;
const DETAIL_FILE_PATH = FilePathStub({ value: DETAIL_FILE_PATH_VALUE });
// Matches the literal VALID_QUEST_ID used by every test in quest-ward-detail-responder.test.ts —
// the responder passes params.questId straight through, so the mocked address must match it.
const DETAIL_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

const FIXED_DETAIL = {
  checks: [
    {
      checkType: 'lint',
      projectResults: [
        {
          errors: [{ filePath: 'packages/web/src/index.ts', message: 'Unexpected any', line: 10 }],
        },
      ],
    },
  ],
};

export const QuestWardDetailResponderProxy = (): {
  setupDetail: () => { expectedDetail: typeof FIXED_DETAIL };
  setupNotFound: () => void;
  callResponder: typeof QuestWardDetailResponder;
} => {
  const findPathProxy = questFindQuestPathBrokerProxy();
  const locationsProxy = locationsWardResultsPathFindBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const readFileProxy = fsReadFileAdapterProxy();

  const setupPaths = (): void => {
    findPathProxy.setupQuestPath({
      questId: DETAIL_QUEST_ID,
      guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
      questPath: AbsoluteFilePathStub({ value: '/home/testuser/quest' }),
    });
    locationsProxy.setupWardResultsPath({
      questFolderPath: '/home/testuser/quest',
      wardResultsPath: SharedFilePathStub({ value: '/home/testuser/quest/ward-results' }),
    });
    joinHandle
      .calledWith(['/home/testuser/quest/ward-results', `${DETAIL_WARD_RESULT_ID}.json`])
      .returns(DETAIL_FILE_PATH_VALUE);
  };

  return {
    setupDetail: (): { expectedDetail: typeof FIXED_DETAIL } => {
      setupPaths();
      readFileProxy.returns({
        filepath: DETAIL_FILE_PATH,
        contents: FileContentsStub({ value: JSON.stringify(FIXED_DETAIL) }),
      });
      return { expectedDetail: FIXED_DETAIL };
    },
    setupNotFound: (): void => {
      setupPaths();
      readFileProxy.throws({
        filepath: DETAIL_FILE_PATH,
        error: new Error('ENOENT: no such file or directory'),
      });
    },
    callResponder: QuestWardDetailResponder,
  };
};
