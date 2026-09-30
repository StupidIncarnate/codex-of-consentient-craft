import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { join } from '#gateway/node/path';
import { stdinIsTtyProxy } from '#gateway/node/process/stdin-is-tty/stdin-is-tty.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';

import { createPackageResolveRequestBrokerProxy } from '../../../brokers/create-package/resolve-request/create-package-resolve-request-broker.proxy';
import { packageRegisterBrokerProxy } from '../../../brokers/package/register/package-register-broker.proxy';
import { packageScaffoldWriteBrokerProxy } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker.proxy';

const JEST_CONFIG_BASE_FILENAME = 'jest.config.base.js';

export const CliCreatePackageResponderProxy = (): {
  setupRootPackageJson: (params: { projectRoot: string; contents: string }) => void;
  setupTargetMissing: (params: {
    packageRoot: string;
    files: readonly { relativePath: string; contents: string }[];
  }) => void;
  // Stages the repo-root build config file as PRESENT, the shape of THIS checkout's own
  // packages — setupRootPackageJson stages it absent by default, which is the shape of a
  // real consumer repo.
  setupMonorepoBuildConfig: (params: { projectRoot: string }) => void;
  getOutput: () => readonly unknown[];
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  // Never interactive in this responder's tests, so its own setupAnswers is never needed — this
  // call only satisfies composition (an unmocked readline.createInterface would never be reached).
  createPackageResolveRequestBrokerProxy();
  const existsProxy = existsSyncProxy();
  const scaffoldWriteProxy = packageScaffoldWriteBrokerProxy();
  const registerProxy = packageRegisterBrokerProxy();
  const readProxy = readFileProxy();
  stdinIsTtyProxy();
  const stdout = stdoutProxy();
  const rootPackageJsonPathHolder: string[] = [];

  return {
    setupRootPackageJson: ({
      projectRoot,
      contents,
    }: {
      projectRoot: string;
      contents: string;
    }): void => {
      const packageJsonPath = join(projectRoot, 'package.json');
      readProxy.returns({ path: packageJsonPath, contents });
      rootPackageJsonPathHolder.push(packageJsonPath);
      // Covers packageRegisterBroker's OWN read of the same path plus its write, in case the
      // responder's registration step needs to persist a change.
      registerProxy.setupRootPackageJson({ projectRoot, contents });
      const jestConfigBasePath = join(projectRoot, JEST_CONFIG_BASE_FILENAME);
      existsProxy.returns({ path: jestConfigBasePath, exists: false });
    },

    setupTargetMissing: ({
      packageRoot,
      files,
    }: {
      packageRoot: string;
      files: readonly { relativePath: string; contents: string }[];
    }): void => {
      scaffoldWriteProxy.setupTargetMissing({ packageRoot, files });
    },

    setupMonorepoBuildConfig: ({ projectRoot }: { projectRoot: string }): void => {
      const jestConfigBasePath = join(projectRoot, JEST_CONFIG_BASE_FILENAME);
      existsProxy.returns({ path: jestConfigBasePath, exists: true });
    },

    getOutput: (): readonly unknown[] => stdout.getWrites(),

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] => {
      const scaffolded = scaffoldWriteProxy.getWrittenFiles();
      const [registeredContent] = registerProxy.getWrittenContents();
      const [rootPackageJsonPath] = rootPackageJsonPathHolder;
      const registeredEntry =
        registeredContent !== undefined && rootPackageJsonPath !== undefined
          ? [{ path: rootPackageJsonPath, content: registeredContent }]
          : [];
      return [...scaffolded, ...registeredEntry];
    },
  };
};
