import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { basename, join } from '#gateway/node/path';
import {
  filePathContract,
  type FileContents,
  type FilePath,
  type PathSegment,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';

import { createPackageResolveRequestBrokerProxy } from '../../../brokers/create-package/resolve-request/create-package-resolve-request-broker.proxy';
import { packageRegisterBrokerProxy } from '../../../brokers/package/register/package-register-broker.proxy';
import { packageScaffoldWriteBrokerProxy } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker.proxy';

const JEST_CONFIG_BASE_FILENAME = 'jest.config.base.js';

export const CliCreatePackageResponderProxy = (): {
  setupRootPackageJson: (params: { projectRoot: FilePath; contents: string }) => void;
  setupTargetMissing: (params: {
    packageRoot: FilePath;
    files: readonly { relativePath: PathSegment; contents: FileContents }[];
  }) => void;
  // Stages the repo-root build config file as PRESENT, the shape of THIS checkout's own
  // packages — setupRootPackageJson stages it absent by default, which is the shape of a
  // real consumer repo.
  setupMonorepoBuildConfig: (params: { projectRoot: FilePath }) => void;
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
  const realPath = requireActual<{ join: typeof join; basename: typeof basename }>({
    module: 'path',
  });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const basenameHandle = registerMock({ fn: basename });
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.calledWith([(chunk: unknown) => typeof chunk === 'string']).returns(true);
  const rootPackageJsonPathHolder: FilePath[] = [];

  return {
    setupRootPackageJson: ({
      projectRoot,
      contents,
    }: {
      projectRoot: FilePath;
      contents: string;
    }): void => {
      const packageJsonPath = filePathContract.parse(join(projectRoot, 'package.json'));
      readProxy.returns({ path: packageJsonPath, contents });
      rootPackageJsonPathHolder.push(packageJsonPath);
      basenameHandle.calledWith([projectRoot]).returns(realPath.basename(projectRoot));
      // Covers packageRegisterBroker's OWN read of the same path plus its write, in case the
      // responder's registration step needs to persist a change.
      registerProxy.setupRootPackageJson({ projectRoot, contents });
      const jestConfigBasePath = filePathContract.parse(
        join(projectRoot, JEST_CONFIG_BASE_FILENAME),
      );
      existsProxy.returns({ path: jestConfigBasePath, exists: false });
    },

    setupTargetMissing: ({
      packageRoot,
      files,
    }: {
      packageRoot: FilePath;
      files: readonly { relativePath: PathSegment; contents: FileContents }[];
    }): void => {
      scaffoldWriteProxy.setupTargetMissing({ packageRoot, files });
    },

    setupMonorepoBuildConfig: ({ projectRoot }: { projectRoot: FilePath }): void => {
      const jestConfigBasePath = filePathContract.parse(
        join(projectRoot, JEST_CONFIG_BASE_FILENAME),
      );
      existsProxy.returns({ path: jestConfigBasePath, exists: true });
    },

    getOutput: (): readonly unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),

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
