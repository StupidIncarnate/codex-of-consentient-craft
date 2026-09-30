import type { Dirent } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { readPackageCliContentLayerBrokerProxy } from './read-package-cli-content-layer-broker.proxy';
import { findFirstFlowFileRecursiveLayerBrokerProxy } from './find-first-flow-file-recursive-layer-broker.proxy';
import { hasResponderCreateLayerBrokerProxy } from './has-responder-create-layer-broker.proxy';
import { dirExistsInParentLayerBrokerProxy } from './dir-exists-in-parent-layer-broker.proxy';
import { binEntryCountLayerBrokerProxy } from './bin-entry-count-layer-broker.proxy';
import { detectPackageTypeLayerBrokerProxy } from './detect-package-type-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

const makeDirDirent = ({ name }: { name: string }): Dirent =>
  DirentStub({ name, kind: 'directory' });

const makeFileDirent = ({ name }: { name: string }): Dirent => DirentStub({ name, kind: 'file' });

export const architecturePackageTypeDetectBrokerProxy = (): {
  setupPackage: ({
    packageRoot,
    srcDirNames,
    packageJsonContent,
    startupFileName,
    startupFileContent,
    binFileName,
    binFileContent,
    flowFilePath,
    flowFileContent,
    responderDirNames,
    responderHookSubDirs,
    brokerDirNames,
    responderDomainSubDirs,
  }: {
    packageRoot: string;
    srcDirNames?: readonly string[];
    packageJsonContent?: string;
    startupFileName?: string;
    startupFileContent?: string;
    binFileName?: string;
    binFileContent?: string;
    flowFilePath?: string;
    flowFileContent?: string;
    responderDirNames?: readonly string[];
    responderHookSubDirs?: readonly string[];
    brokerDirNames?: readonly string[];
    responderDomainSubDirs?: Record<string, readonly string[]>;
  }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readFileProxy = readFileOptionalLayerBrokerProxy();
  readPackageCliContentLayerBrokerProxy();
  findFirstFlowFileRecursiveLayerBrokerProxy();
  hasResponderCreateLayerBrokerProxy();
  dirExistsInParentLayerBrokerProxy();
  binEntryCountLayerBrokerProxy();
  detectPackageTypeLayerBrokerProxy();

  return {
    setupPackage: ({
      packageRoot,
      srcDirNames = [],
      packageJsonContent = '{}',
      startupFileName,
      startupFileContent,
      binFileName,
      binFileContent,
      flowFilePath,
      flowFileContent,
      responderDirNames = [],
      responderHookSubDirs = [],
      brokerDirNames = [],
      responderDomainSubDirs = {},
    }: {
      packageRoot: string;
      srcDirNames?: readonly string[];
      packageJsonContent?: string;
      startupFileName?: string;
      startupFileContent?: string;
      binFileName?: string;
      binFileContent?: string;
      flowFilePath?: string;
      flowFileContent?: string;
      responderDirNames?: readonly string[];
      responderHookSubDirs?: readonly string[];
      brokerDirNames?: readonly string[];
      responderDomainSubDirs?: Record<string, readonly string[]>;
    }): void => {
      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          if (dirPath === `${packageRoot}/src`) {
            return srcDirNames.map((name) => makeDirDirent({ name }));
          }
          if (dirPath === `${packageRoot}/src/startup`) {
            if (startupFileName !== undefined) {
              return [makeFileDirent({ name: startupFileName })];
            }
            return [];
          }
          if (dirPath === `${packageRoot}/bin`) {
            return binFileName === undefined ? [] : [makeFileDirent({ name: binFileName })];
          }
          if (dirPath === `${packageRoot}/src/flows`) {
            if (flowFilePath !== undefined) {
              const parts = flowFilePath.split('/');
              const flowFileName = parts[parts.length - 1] ?? 'flow.ts';
              return [makeFileDirent({ name: flowFileName })];
            }
            return [];
          }
          if (dirPath === `${packageRoot}/src/responders`) {
            return responderDirNames.map((name) => makeDirDirent({ name }));
          }
          if (dirPath === `${packageRoot}/src/responders/hook`) {
            return responderHookSubDirs.map((name) => makeDirDirent({ name }));
          }
          if (dirPath === `${packageRoot}/src/brokers`) {
            return brokerDirNames.map((name) => makeDirDirent({ name }));
          }
          for (const [domainName, subDirs] of Object.entries(responderDomainSubDirs)) {
            if (dirPath === `${packageRoot}/src/responders/${domainName}`) {
              return subDirs.map((name) => makeDirDirent({ name }));
            }
          }
          return [];
        },
      });

      readFileProxy.setupImplementation({
        fn: (filePath: string): string => {
          if (String(filePath) === `${packageRoot}/package.json`) {
            return packageJsonContent;
          }
          if (
            startupFileName !== undefined &&
            String(filePath) === `${packageRoot}/src/startup/${startupFileName}`
          ) {
            if (startupFileContent !== undefined) {
              return startupFileContent;
            }
            throw FileMissingErrorStub({ path: String(filePath) });
          }
          if (
            binFileName !== undefined &&
            binFileContent !== undefined &&
            String(filePath) === `${packageRoot}/bin/${binFileName}`
          ) {
            return binFileContent;
          }
          if (flowFilePath !== undefined && String(filePath) === flowFilePath) {
            if (flowFileContent !== undefined) {
              return flowFileContent;
            }
            throw FileMissingErrorStub({ path: String(filePath) });
          }
          throw FileMissingErrorStub({ path: String(filePath) });
        },
      });
    },
  };
};
