/**
 * PURPOSE: Stages the home/root/profiles resolution chain this broker composes, then leaves its own
 * two joins to `pathJoinAdapterProxy`'s real passthrough — so a test asserts the genuine
 * `<profiles>/samples` and `<profiles>/boots` strings rather than two more values it fed in itself.
 *
 * USAGE:
 * const proxy = locationsProfileDirsFindBrokerProxy();
 * proxy.setupProfilesPath({ homeDir, homePath, rootPath, profilesPath });
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { locationsProfilesPathFindBrokerProxy } from '../profiles-path-find/locations-profiles-path-find-broker.proxy';

export const locationsProfileDirsFindBrokerProxy = (): {
  setupProfilesPath: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    profilesPath: FilePath;
  }) => void;
} => {
  const profilesProxy = locationsProfilesPathFindBrokerProxy();
  // Constructed, never staged: this broker's own two joins are meant to run through the real
  // passthrough so a test reads back the genuine samples/ and boots/ strings.
  pathJoinAdapterProxy();

  return {
    setupProfilesPath: ({
      homeDir,
      homePath,
      rootPath,
      profilesPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      profilesPath: FilePath;
    }): void => {
      profilesProxy.setupProfilesPath({ homeDir, homePath, rootPath, profilesPath });
    },
  };
};
