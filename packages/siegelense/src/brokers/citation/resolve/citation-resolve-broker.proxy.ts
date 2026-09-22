import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { locationsCitationQuestFilePathFindBrokerProxy } from '../../locations/citation-quest-file-path-find/locations-citation-quest-file-path-find-broker.proxy';
import { questRecordParseLayerBrokerProxy } from './quest-record-parse-layer-broker.proxy';
import { unjudgedScreencastLayerBrokerProxy } from './unjudged-screencast-layer-broker.proxy';
import { verifiedPreludeLayerBrokerProxy } from './verified-prelude-layer-broker.proxy';
import { walkedNoteLayerBrokerProxy } from './walked-note-layer-broker.proxy';

export const citationResolveBrokerProxy = (): {
  setupQuestFolder: (params: {
    homeDir: string;
    homePath: FilePath;
    guildPath: FilePath;
    guildQuestsPath: FilePath;
    questFolderPath: FilePath;
  }) => void;
  setupQuestRecord: (params: { filePath: AbsoluteFilePath; contents: string }) => void;
  setupQuestRecordMissing: (params: { filePath: AbsoluteFilePath }) => void;
  setupPlansDir: (params: { dirPath: AbsoluteFilePath; entries: readonly string[] }) => void;
  setupPlanFile: (params: { filePath: AbsoluteFilePath; contents: string }) => void;
  setupNotADirectory: (params: { dirPath: AbsoluteFilePath }) => void;
  setupEvidenceTree: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
  setupRunDir: (params: { dirPath: AbsoluteFilePath; entries: readonly string[] }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();
  const questFilePathProxy = locationsCitationQuestFilePathFindBrokerProxy();
  const preludeProxy = verifiedPreludeLayerBrokerProxy();
  const screencastProxy = unjudgedScreencastLayerBrokerProxy();
  errorIsNativeErrorAdapterProxy();
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
      readFileProxy.resolves({ filePath, content: contents });
    },

    // The RAW fs error, not a pre-wrapped one: `fsReadFileAdapter` catches whatever `readFile`
    // throws and re-throws it as `new Error('Failed to read file at …', { cause })`. Staging an
    // already-wrapped error here buries the ENOENT one level deeper than the broker's own check
    // looks, and the broker then rethrows instead of answering blocked.
    setupQuestRecordMissing: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      readFileProxy.rejects({
        filePath,
        error: Object.assign(new Error(`ENOENT: no such file or directory, open '${filePath}'`), {
          code: 'ENOENT',
        }),
      });
    },

    setupPlansDir: preludeProxy.setupPlansDir,
    setupPlanFile: preludeProxy.setupPlanFile,
    setupNotADirectory: preludeProxy.setupNotADirectory,

    setupEvidenceTree: screencastProxy.setupEvidenceTree,
    setupRunDir: screencastProxy.setupRunDir,
  };
};
