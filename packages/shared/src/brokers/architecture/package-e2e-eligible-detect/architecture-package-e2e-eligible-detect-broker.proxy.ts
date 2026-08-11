import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

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

export const architecturePackageE2eEligibleDetectBrokerProxy = (): {
  setupPackage: (params: {
    packageRoot: string;
    srcDirNames?: readonly string[];
    adapterDirNames?: readonly string[];
    packageJsonContent?: string;
  }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readFileProxy = readFileOptionalLayerBrokerProxy();

  return {
    setupPackage: ({
      packageRoot,
      srcDirNames = [],
      adapterDirNames = [],
      packageJsonContent = '{}',
    }: {
      packageRoot: string;
      srcDirNames?: readonly string[];
      adapterDirNames?: readonly string[];
      packageJsonContent?: string;
    }): void => {
      // Exact-path addresses (not .setupImplementation's low-specificity, score-0 catch-all) — a
      // sibling proxy elsewhere in the same test that stages ANY real address for readdirSync or
      // readFileSync (even a predicate matching "any string path") would otherwise outrank a
      // catch-all regardless of registration order, since specificity is scored per call, not by
      // recency alone.
      readdirProxy.setupDirectory({
        dirPath: AbsoluteFilePathStub({ value: `${packageRoot}/src` }),
        entries: srcDirNames.map((name) => makeDirDirent({ name })),
      });
      readdirProxy.setupDirectory({
        dirPath: AbsoluteFilePathStub({ value: `${packageRoot}/src/adapters` }),
        entries: adapterDirNames.map((name) => makeDirDirent({ name })),
      });
      readFileProxy.setupReturns({
        filePath: AbsoluteFilePathStub({ value: `${packageRoot}/package.json` }),
        content: ContentTextStub({ value: packageJsonContent }),
      });
    },
  };
};
