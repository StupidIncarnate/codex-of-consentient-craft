/**
 * PURPOSE: Stages the home/root/profiles resolution chain this broker composes, then leaves its own
 * two joins to `join`'s real passthrough default — so a test asserts the genuine
 * `<profiles>/samples` and `<profiles>/boots` strings rather than two more values it fed in itself.
 *
 * USAGE:
 * const proxy = locationsProfileDirsFindBrokerProxy();
 * proxy.setupProfilesPath({ homeDir, homePath, rootPath, profilesPath });
 */

import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

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
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — constructed, never staged: this broker's own two joins are
  // meant to run through the real passthrough default profilesProxy's own composition chain
  // (down to dungeonmasterHomeFindBrokerProxy) already registers on this same '#gateway/node/path'
  // `join` reference, so a test reads back the genuine samples/ and boots/ strings.
  registerMock({ fn: join });

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
