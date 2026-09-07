import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { FileContents, FilePath, PathSegment } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { createPackageResolveRequestBrokerProxy } from '../../../brokers/create-package/resolve-request/create-package-resolve-request-broker.proxy';
import { packageRegisterBrokerProxy } from '../../../brokers/package/register/package-register-broker.proxy';
import { packageScaffoldWriteBrokerProxy } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker.proxy';

export const CliCreatePackageResponderProxy = (): {
  setupRootPackageJson: (params: { projectRoot: FilePath; contents: string }) => void;
  setupTargetMissing: (params: {
    packageRoot: FilePath;
    files: readonly { relativePath: PathSegment; contents: FileContents }[];
  }) => void;
  getOutput: () => readonly unknown[];
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  // Never interactive in this responder's tests, so its own setupAnswers is never needed — this
  // call only satisfies composition (an unmocked readline.createInterface would never be reached).
  createPackageResolveRequestBrokerProxy();
  // Unstaged: the responder's packageRoot/packageJsonPath joins are real path.join calls with no
  // fake value to stage, same reasoning as packageRegisterBrokerProxy's own bare call below.
  pathJoinAdapterProxy();
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

    getOutput: (): readonly unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      scaffoldWriteProxy.getWrittenFiles(),
  };
};
