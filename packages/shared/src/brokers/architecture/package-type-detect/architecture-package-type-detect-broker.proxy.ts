import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { findFirstStartupFileLayerBrokerProxy } from './find-first-startup-file-layer-broker.proxy';
import { findFirstFlowFileRecursiveLayerBrokerProxy } from './find-first-flow-file-recursive-layer-broker.proxy';
import { hasResponderCreateLayerBrokerProxy } from './has-responder-create-layer-broker.proxy';
import { dirExistsInParentLayerBrokerProxy } from './dir-exists-in-parent-layer-broker.proxy';
import { binEntryCountLayerBrokerProxy } from './bin-entry-count-layer-broker.proxy';
import { detectPackageTypeLayerBrokerProxy } from './detect-package-type-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

const makeDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

const makeFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const architecturePackageTypeDetectBrokerProxy = (): {
  setupPackage: ({
    packageRoot,
    srcDirNames,
    adapterDirNames,
    packageJsonContent,
    startupFileName,
    startupFileContent,
    flowFilePath,
    flowFileContent,
    responderDirNames,
    responderHookSubDirs,
    brokerDirNames,
    responderDomainSubDirs,
  }: {
    packageRoot: string;
    srcDirNames?: readonly string[];
    adapterDirNames?: readonly string[];
    packageJsonContent?: string;
    startupFileName?: string;
    startupFileContent?: ContentText;
    flowFilePath?: string;
    flowFileContent?: ContentText;
    responderDirNames?: readonly string[];
    responderHookSubDirs?: readonly string[];
    brokerDirNames?: readonly string[];
    responderDomainSubDirs?: Record<string, readonly string[]>;
  }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readFileProxy = readFileOptionalLayerBrokerProxy();
  findFirstStartupFileLayerBrokerProxy();
  findFirstFlowFileRecursiveLayerBrokerProxy();
  hasResponderCreateLayerBrokerProxy();
  dirExistsInParentLayerBrokerProxy();
  binEntryCountLayerBrokerProxy();
  detectPackageTypeLayerBrokerProxy();

  return {
    setupPackage: ({
      packageRoot,
      srcDirNames = [],
      adapterDirNames = [],
      packageJsonContent = '{}',
      startupFileName,
      startupFileContent,
      flowFilePath,
      flowFileContent,
      responderDirNames = [],
      responderHookSubDirs = [],
      brokerDirNames = [],
      responderDomainSubDirs = {},
    }: {
      packageRoot: string;
      srcDirNames?: readonly string[];
      adapterDirNames?: readonly string[];
      packageJsonContent?: string;
      startupFileName?: string;
      startupFileContent?: ContentText;
      flowFilePath?: string;
      flowFileContent?: ContentText;
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
          if (dirPath === `${packageRoot}/src/adapters`) {
            return adapterDirNames.map((name) => makeDirDirent({ name }));
          }
          if (dirPath === `${packageRoot}/src/startup`) {
            if (startupFileName !== undefined) {
              return [makeFileDirent({ name: startupFileName })];
            }
            return [];
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
        fn: (filePath: ContentText): ContentText => {
          if (String(filePath) === `${packageRoot}/package.json`) {
            return ContentTextStub({ value: packageJsonContent });
          }
          if (
            startupFileName !== undefined &&
            String(filePath) === `${packageRoot}/src/startup/${startupFileName}`
          ) {
            if (startupFileContent !== undefined) {
              return startupFileContent;
            }
            throw new Error('ENOENT');
          }
          if (flowFilePath !== undefined && String(filePath) === flowFilePath) {
            if (flowFileContent !== undefined) {
              return flowFileContent;
            }
            throw new Error('ENOENT');
          }
          throw new Error('ENOENT');
        },
      });
    },
  };
};
