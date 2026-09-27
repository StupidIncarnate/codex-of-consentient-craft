import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { configRootFindBrokerProxy } from '../../config-root/find/config-root-find-broker.proxy';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsMcpJsonPathFindBrokerProxy = (): {
  setupMcpJsonPath: (params: {
    startPath: string;
    configRootPath: string;
    mcpJsonPath: FilePath;
  }) => void;
} => {
  const configRootProxy = configRootFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    setupMcpJsonPath: ({
      startPath,
      configRootPath,
      mcpJsonPath,
    }: {
      startPath: string;
      configRootPath: string;
      mcpJsonPath: FilePath;
    }): void => {
      // setupConfigRootFoundInParent (not setupConfigRootFound): the exact-tuple join stage below
      // only matches when configRootFindBroker really walks up and returns configRootPath.
      // setupConfigRootFound stages the config as found immediately at startPath regardless of
      // the configRootPath argument, which the old address-less path-join-adapter stub never
      // caught because it returned mcpJsonPath for ANY join() call.
      configRootProxy.setupConfigRootFoundInParent({ startPath, configRootPath });
      joinHandle
        .calledWith([configRootPath, locationsStatics.repoRoot.mcpJson])
        .returns(mcpJsonPath);
    },
  };
};
