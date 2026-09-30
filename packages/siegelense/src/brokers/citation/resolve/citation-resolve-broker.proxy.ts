import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { locationsCitationQuestFilePathFindBrokerProxy } from '../../locations/citation-quest-file-path-find/locations-citation-quest-file-path-find-broker.proxy';
import { questRecordParseLayerBrokerProxy } from './quest-record-parse-layer-broker.proxy';
import { verifiedPreludeLayerBrokerProxy } from './verified-prelude-layer-broker.proxy';
import { walkedNoteLayerBrokerProxy } from './walked-note-layer-broker.proxy';

export const citationResolveBrokerProxy = (): {
  setupQuestFolder: (params: {
    homeDir: string;
    homePath: string;
    guildPath: string;
    guildQuestsPath: string;
    questFolderPath: string;
  }) => void;
  setupQuestRecord: (params: { filePath: AbsoluteFilePath; contents: string }) => void;
  setupQuestRecordMissing: (params: { filePath: AbsoluteFilePath }) => void;
  setupPlansDir: (params: { dirPath: AbsoluteFilePath; entries: readonly string[] }) => void;
  setupPlanFile: (params: { filePath: AbsoluteFilePath; contents: string }) => void;
  setupNotADirectory: (params: { dirPath: AbsoluteFilePath }) => void;
} => {
  const readFileProxy = readFileIfExistsProxy();
  const questFilePathProxy = locationsCitationQuestFilePathFindBrokerProxy();
  const preludeProxy = verifiedPreludeLayerBrokerProxy();
  questRecordParseLayerBrokerProxy();
  walkedNoteLayerBrokerProxy();

  return {
    setupQuestFolder: questFilePathProxy.setupQuestFolder,

    setupQuestRecord: ({
      filePath,
      contents,
    }: {
      filePath: AbsoluteFilePath;
      contents: string;
    }): void => {
      readFileProxy.returns({ path: filePath, contents });
    },

    setupQuestRecordMissing: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      readFileProxy.missing({ path: filePath });
    },

    setupPlansDir: preludeProxy.setupPlansDir,
    setupPlanFile: preludeProxy.setupPlanFile,
    setupNotADirectory: preludeProxy.setupNotADirectory,
  };
};
