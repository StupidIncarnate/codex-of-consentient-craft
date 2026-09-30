import type { FileContents } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { writeFileSyncProxy } from '#gateway/node/fs/write-file-sync/write-file-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { eslintConfigFilesStatics } from '../../../statics/eslint-config-files/eslint-config-files-statics';
import { InstallDetectConfigResponder } from './install-detect-config-responder';

export const InstallDetectConfigResponderProxy = (): {
  callResponder: typeof InstallDetectConfigResponder;
  setupNoConfigExists: (params: { targetProjectRoot: string }) => void;
  setupConfigExists: (params: {
    targetProjectRoot: string;
    configFileName: string;
    contents: FileContents;
  }) => void;
  getWrittenConfigContent: (params: { targetProjectRoot: string }) => unknown;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();
  const writeProxy = writeFileSyncProxy();

  return {
    callResponder: InstallDetectConfigResponder,

    setupNoConfigExists: ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
      // The responder joins targetProjectRoot onto every candidate config filename before
      // checking existence, then again onto the new-config filename before writing — join is
      // real, so stage an explicit false existsSync answer at each joined path, since
      // existsSyncProxy ships no address-less catch-all.
      for (const configFile of eslintConfigFilesStatics) {
        const joinedPath = `${targetProjectRoot}/${configFile}`;
        existsProxy.returns({ path: joinedPath, exists: false });
      }

      const [, newConfigFile] = locationsStatics.repoRoot.eslintConfig;
      const newConfigPath = `${targetProjectRoot}/${newConfigFile}`;
      writeProxy.succeeds({ path: newConfigPath });
    },

    setupConfigExists: ({
      targetProjectRoot,
      configFileName,
      contents,
    }: {
      targetProjectRoot: string;
      configFileName: string;
      contents: FileContents;
    }): void => {
      // The loop probes EVERY candidate filename in order before existence short-circuits on a
      // match, so every candidate ahead of configFileName needs an explicit existsSync answer
      // too — not just the one that matches.
      for (const configFile of eslintConfigFilesStatics) {
        const joinedPath = `${targetProjectRoot}/${configFile}`;
        existsProxy.returns({ path: joinedPath, exists: configFile === configFileName });
      }

      const filePath = `${targetProjectRoot}/${configFileName}`;
      readProxy.returns({ path: filePath, contents });
    },

    getWrittenConfigContent: ({ targetProjectRoot }: { targetProjectRoot: string }): unknown => {
      const [, newConfigFile] = locationsStatics.repoRoot.eslintConfig;
      const newConfigPath = `${targetProjectRoot}/${newConfigFile}`;
      return writeProxy.writtenContents({ path: newConfigPath });
    },
  };
};
