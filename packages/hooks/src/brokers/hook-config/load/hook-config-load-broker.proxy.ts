import { resolve } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { hookConfigDefaultBrokerProxy } from '../default/hook-config-default-broker.proxy';
import { hookConfigMergeBrokerProxy } from '../merge/hook-config-merge-broker.proxy';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const hookConfigLoadBrokerProxy = (): {
  setupConfigPath: (params: { workingDir: string; filename: string; path: FilePath }) => void;
  setupConfigExists: (params: { filePath: FilePath; exists: boolean }) => void;
} => {
  cwdProxy();
  const resolveHandle = registerMock({ fn: resolve });
  const fsProxy = existsSyncProxy();
  hookConfigDefaultBrokerProxy();
  hookConfigMergeBrokerProxy();

  // hookConfigLoadBroker resolves every candidate config filename before checking existence.
  // resolve has an address-less default here because tests don't specify cwd/candidate combinations.
  const unusedConfigPath = FilePathStub({ value: '/unused/config/path' });
  resolveHandle.calledWith([]).returns(unusedConfigPath);
  fsProxy.returns({ path: unusedConfigPath, exists: false });

  for (const filename of locationsStatics.hooks.configFiles) {
    fsProxy.returns({ path: filename, exists: false });
  }

  return {
    setupConfigPath: ({
      workingDir,
      filename,
      path,
    }: {
      workingDir: string;
      filename: string;
      path: FilePath;
    }): void => {
      resolveHandle.calledWith([workingDir, filename]).returns(path);
    },
    setupConfigExists: ({ filePath, exists }: { filePath: FilePath; exists: boolean }): void => {
      fsProxy.returns({ path: filePath, exists });
    },
  };
};
