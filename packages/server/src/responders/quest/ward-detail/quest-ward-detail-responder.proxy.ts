import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FilePathStub as SharedFilePathStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';
import {
  locationsWardResultsPathFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { orchestratorFindQuestPathAdapterProxy } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { QuestWardDetailResponder } from './quest-ward-detail-responder';

const DETAIL_FILE_PATH_VALUE = '/home/testuser/quest/ward-results/result.json';
const DETAIL_FILE_PATH = FilePathStub({ value: DETAIL_FILE_PATH_VALUE });

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
  const findPathProxy = orchestratorFindQuestPathAdapterProxy();
  const locationsProxy = locationsWardResultsPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const setupPaths = (): void => {
    findPathProxy.returns({
      questPath: AbsoluteFilePathStub({ value: '/home/testuser/quest' }),
      guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
    });
    locationsProxy.setupWardResultsPath({
      wardResultsPath: SharedFilePathStub({ value: '/home/testuser/quest/ward-results' }),
    });
    pathJoinProxy.returns({ result: SharedFilePathStub({ value: DETAIL_FILE_PATH_VALUE }) });
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
