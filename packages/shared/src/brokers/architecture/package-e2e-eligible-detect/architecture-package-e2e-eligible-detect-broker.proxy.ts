import type { DirEntrySync } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const makeDirDirent = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'directory' });

export const architecturePackageE2eEligibleDetectBrokerProxy = (): {
  setupPackage: (params: {
    packageRoot: string;
    srcDirNames?: readonly string[];
    packageJsonContent?: string;
  }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readFileProxy = readFileOptionalLayerBrokerProxy();

  return {
    setupPackage: ({
      packageRoot,
      srcDirNames = [],
      packageJsonContent = '{}',
    }: {
      packageRoot: string;
      srcDirNames?: readonly string[];
      packageJsonContent?: string;
    }): void => {
      // Exact-path addresses (not .setupImplementation's low-specificity, score-0 catch-all) — a
      // sibling proxy elsewhere in the same test that stages ANY real address for readdirSync or
      // readFileSync (even a predicate matching "any string path") would otherwise outrank a
      // catch-all regardless of registration order, since specificity is scored per call, not by
      // recency alone.
      readdirProxy.setupDirectory({
        dirPath: `${packageRoot}/src`,
        entries: srcDirNames.map((name) => makeDirDirent({ name })),
      });
      readFileProxy.setupReturns({
        filePath: `${packageRoot}/package.json`,
        content: ContentTextStub({ value: packageJsonContent }),
      });
    },
  };
};
