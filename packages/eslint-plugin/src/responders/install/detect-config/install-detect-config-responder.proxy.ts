import type { FileContents } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { writeFileSyncProxy } from '#gateway/node/fs/write-file-sync/write-file-sync.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
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
  const joinProxy = pathJoinAdapterProxy();
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  const writeProxy = writeFileSyncProxy();

  return {
    callResponder: InstallDetectConfigResponder,

    setupNoConfigExists: ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
      // The responder joins targetProjectRoot onto every candidate config filename before
      // checking existence, then again onto the new-config filename before writing — stage the
      // real join result AND an explicit false existsSync answer for each, since existsSyncProxy
      // ships no address-less catch-all.
      for (const configFile of eslintConfigFilesStatics) {
        const joinedPath = filePathContract.parse(`${targetProjectRoot}/${configFile}`);
        joinProxy.returns({ paths: [targetProjectRoot, configFile], result: joinedPath });
        existsProxy.returns({ path: joinedPath, exists: false });
      }

      const [, newConfigFile] = locationsStatics.repoRoot.eslintConfig;
      const newConfigPath = filePathContract.parse(`${targetProjectRoot}/${newConfigFile}`);
      joinProxy.returns({ paths: [targetProjectRoot, newConfigFile], result: newConfigPath });
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
      // The loop joins EVERY candidate filename in order before existence short-circuits on a
      // match, so every candidate ahead of configFileName needs a staged join AND an explicit
      // existsSync answer too — not just the one that matches.
      for (const configFile of eslintConfigFilesStatics) {
        const joinedPath = filePathContract.parse(`${targetProjectRoot}/${configFile}`);
        joinProxy.returns({ paths: [targetProjectRoot, configFile], result: joinedPath });
        existsProxy.returns({ path: joinedPath, exists: configFile === configFileName });
      }

      const filePath = filePathContract.parse(`${targetProjectRoot}/${configFileName}`);
      readProxy.returns({ filePath, contents });
    },

    getWrittenConfigContent: ({ targetProjectRoot }: { targetProjectRoot: string }): unknown => {
      const [, newConfigFile] = locationsStatics.repoRoot.eslintConfig;
      const newConfigPath = filePathContract.parse(`${targetProjectRoot}/${newConfigFile}`);
      return writeProxy.writtenContents({ path: newConfigPath });
    },
  };
};
