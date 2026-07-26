import type { PathLike } from 'fs';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { fsWriteFileSyncAdapterProxy } from '../../../adapters/fs/write-file-sync/fs-write-file-sync-adapter.proxy';
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
} => {
  const joinProxy = pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  const writeProxy = fsWriteFileSyncAdapterProxy();

  return {
    callResponder: InstallDetectConfigResponder,

    setupNoConfigExists: ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
      existsProxy.setupFileSystem(() => false);

      // The responder joins targetProjectRoot onto every candidate config filename before
      // checking existence, then again onto the new-config filename before writing — stage the
      // real join result for each so pathJoinAdapter never sees an undescribed call.
      for (const configFile of eslintConfigFilesStatics) {
        const joinedPath = filePathContract.parse(`${targetProjectRoot}/${configFile}`);
        joinProxy.returns({ paths: [targetProjectRoot, configFile], result: joinedPath });
      }

      const [, newConfigFile] = locationsStatics.repoRoot.eslintConfig;
      const newConfigPath = filePathContract.parse(`${targetProjectRoot}/${newConfigFile}`);
      joinProxy.returns({ paths: [targetProjectRoot, newConfigFile], result: newConfigPath });
      writeProxy.succeeds({ filePath: newConfigPath });
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
      existsProxy.setupFileSystem((path: PathLike) => String(path).endsWith(configFileName));

      // The loop joins EVERY candidate filename in order before existence short-circuits on a
      // match, so every candidate ahead of configFileName needs a staged join too — not just the
      // one that matches.
      for (const configFile of eslintConfigFilesStatics) {
        const joinedPath = filePathContract.parse(`${targetProjectRoot}/${configFile}`);
        joinProxy.returns({ paths: [targetProjectRoot, configFile], result: joinedPath });
      }

      const filePath = filePathContract.parse(`${targetProjectRoot}/${configFileName}`);
      readProxy.returns({ filePath, contents });
    },
  };
};
