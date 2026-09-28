import { adapterCensusBuildBrokerProxy } from '../build/adapter-census-build-broker.proxy';
import { censusRepoReadLayoutBrokerProxy } from '../../census-repo/read-layout/census-repo-read-layout-broker.proxy';
import { censusRepoReadSourcesBrokerProxy } from '../../census-repo/read-sources/census-repo-read-sources-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const adapterCensusRunBrokerProxy = (): {
  setupSharedStemRepo: (params: { repoRoot: AbsoluteFilePath }) => void;
  setupMissingRoot: (params: { repoRoot: AbsoluteFilePath }) => void;
} => {
  const layoutProxy = censusRepoReadLayoutBrokerProxy();
  const sourcesProxy = censusRepoReadSourcesBrokerProxy();
  adapterCensusBuildBrokerProxy();

  return {
    // Two packages each hold an `os/tmp` adapter with the same file stem, and only `app` has a
    // caller: the scenario a text scan of file stems gets wrong.
    setupSharedStemRepo: ({ repoRoot }): void => {
      layoutProxy.setupRoot({ repoRoot, rawContents: JSON.stringify({ name: '@acme/root' }) });
      layoutProxy.setupPackages({
        repoRoot,
        packages: [
          { dir: 'packages/app', rawContents: JSON.stringify({ name: '@acme/app' }) },
          { dir: 'packages/lib', rawContents: JSON.stringify({ name: '@acme/lib' }) },
        ],
      });
      sourcesProxy.setupSources({
        repoRoot,
        files: [
          {
            path: `${repoRoot}/packages/app/src/adapters/os/tmp/os-tmp-adapter.ts`,
            contents: "import { tmpdir } from 'os';\nexport const osTmpAdapter = () => tmpdir();",
          },
          {
            path: `${repoRoot}/packages/lib/src/adapters/os/tmp/os-tmp-adapter.ts`,
            contents: "import { tmpdir } from 'os';\nexport const osTmpAdapter = () => tmpdir();",
          },
          {
            path: `${repoRoot}/packages/app/src/brokers/a/b/a-b-broker.ts`,
            contents:
              "import { osTmpAdapter } from '../../../adapters/os/tmp/os-tmp-adapter';\nexport const aBBroker = () => osTmpAdapter();",
          },
        ],
      });
    },
    setupMissingRoot: ({ repoRoot }): void => {
      layoutProxy.setupMissingRoot({ repoRoot });
    },
  };
};
