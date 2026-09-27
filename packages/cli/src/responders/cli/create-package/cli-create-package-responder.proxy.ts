import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { FileContents, FilePath, PathSegment } from '@dungeonmaster/shared/contracts';
import {
  pathJoinAdapterProxy,
  pathBasenameAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
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
  // packages — every other test leaves it unstaged (fsExistsSyncAdapterProxy's own default is
  // "not found"), which is the shape of a real consumer repo.
  setupMonorepoBuildConfig: (params: { projectRoot: FilePath }) => void;
  getOutput: () => readonly unknown[];
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  // Never interactive in this responder's tests, so its own setupAnswers is never needed — this
  // call only satisfies composition (an unmocked readline.createInterface would never be reached).
  createPackageResolveRequestBrokerProxy();
  // Unstaged: the responder's packageRoot/packageJsonPath joins are real path.join calls with no
  // fake value to stage, same reasoning as packageRegisterBrokerProxy's own bare call below.
  pathJoinAdapterProxy();
  // Unstaged: workspaceScopeFromRootNameTransformer's fallback name is a real path.basename call
  // with nothing to fake — only reached when the root package.json carries no string `name` at all.
  pathBasenameAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const scaffoldWriteProxy = packageScaffoldWriteBrokerProxy();
  const registerProxy = packageRegisterBrokerProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.calledWith([(chunk: unknown) => typeof chunk === 'string']).returns(true);

  return {
    setupRootPackageJson: ({
      projectRoot,
      contents,
    }: {
      projectRoot: FilePath;
      contents: string;
    }): void => {
      const packageJsonPath = pathJoinAdapter({ paths: [projectRoot, 'package.json'] });
      readFileProxy.resolves({ filePath: packageJsonPath, content: contents });
      // Covers packageRegisterBroker's OWN read of the same path plus its write, in case the
      // responder's registration step needs to persist a change.
      registerProxy.setupRootPackageJson({ projectRoot, contents });
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
      const jestConfigBasePath = pathJoinAdapter({
        paths: [projectRoot, JEST_CONFIG_BASE_FILENAME],
      });
      existsProxy.returns({ filePath: jestConfigBasePath, result: true });
    },

    getOutput: (): readonly unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      scaffoldWriteProxy.getWrittenFiles(),
  };
};
