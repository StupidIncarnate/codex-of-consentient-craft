import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FilePathStub as SharedFilePathStub,
  GuildIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { orchestratorFindQuestPathAdapterProxy } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { QuestRiftcarverDetailResponder } from './quest-riftcarver-detail-responder';

const LOG_FILE_PATH_VALUE = '/home/testuser/quest/riftcarver-results/result.log';
const LOG_FILE_PATH = FilePathStub({ value: LOG_FILE_PATH_VALUE });
// Matches the literal VALID_QUEST_ID used by every test in quest-riftcarver-detail-responder.test.ts —
// the responder passes params.questId straight through, so the mocked address must match it.
const DETAIL_QUEST_ID = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });

const FIXED_LOG = '— build pass 1 —\n> tsc\nBuild succeeded\n';

export const QuestRiftcarverDetailResponderProxy = (): {
  setupDetail: () => { expectedLog: typeof FIXED_LOG };
  setupNotFound: () => void;
  callResponder: typeof QuestRiftcarverDetailResponder;
} => {
  const findPathProxy = orchestratorFindQuestPathAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const setupPaths = (): void => {
    findPathProxy.returns({
      questId: DETAIL_QUEST_ID,
      questPath: AbsoluteFilePathStub({ value: '/home/testuser/quest' }),
      guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
    });
    pathJoinProxy.returns({ result: SharedFilePathStub({ value: LOG_FILE_PATH_VALUE }) });
  };

  return {
    setupDetail: (): { expectedLog: typeof FIXED_LOG } => {
      setupPaths();
      readFileProxy.returns({
        filepath: LOG_FILE_PATH,
        contents: FileContentsStub({ value: FIXED_LOG }),
      });
      return { expectedLog: FIXED_LOG };
    },
    setupNotFound: (): void => {
      setupPaths();
      readFileProxy.throws({
        filepath: LOG_FILE_PATH,
        error: new Error('ENOENT: no such file or directory'),
      });
    },
    callResponder: QuestRiftcarverDetailResponder,
  };
};
