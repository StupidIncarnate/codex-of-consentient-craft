import { PackageJsonStub } from '@dungeonmaster/shared/contracts/package-json/package-json.stub';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { moduleResolveBrokerProxy } from '@dungeonmaster/shared/brokers/module/resolve/module-resolve-broker.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

// The broker resolves its OWN package.json by walking up from its own __dirname via
// cwdResolveBroker. This proxy file sits beside the broker file, so __dirname computed here is
// the identical starting point the broker's own call resolves from — staging the walk to land on
// that same directory keeps the two in lockstep without touching the real filesystem.
const OWN_PACKAGE_ROOT = __dirname;
const OWN_PACKAGE_JSON_PATH = `${OWN_PACKAGE_ROOT}/package.json`;

export const webBundlePackageResolveBrokerProxy = (): {
  setupOwnDependencies: (params: { dependencyNames: readonly string[] }) => void;
  setupCandidateReact: (params: { candidateName: string }) => void;
  setupCandidateNoReact: (params: { candidateName: string }) => void;
  setupCandidateUnresolvable: (params: { candidateName: string }) => void;
} => {
  const cwdProxy = cwdResolveBrokerProxy();
  cwdProxy.setupProjectRootFoundAtStart({ startPath: OWN_PACKAGE_ROOT });
  const moduleProxy = moduleResolveBrokerProxy();
  const fsProxy = readFileSyncProxy();

  return {
    // A candidate name not in this list is never probed at all — Object.keys drives the whole
    // walk — which is how the "no candidates" case is described.
    setupOwnDependencies: ({ dependencyNames }: { dependencyNames: readonly string[] }): void => {
      const dependencies = Object.fromEntries(dependencyNames.map((name) => [name, '*']));
      fsProxy.returns({
        path: OWN_PACKAGE_JSON_PATH,
        contents: JSON.stringify(PackageJsonStub({ dependencies })),
      });
    },

    // The candidate's package.json resolves from the package's own root, the same address the
    // broker passes to moduleResolveBroker; the content read from that path is test-controlled.
    setupCandidateReact: ({ candidateName }: { candidateName: string }): void => {
      const path = `${OWN_PACKAGE_ROOT}/node_modules/${candidateName}/package.json`;
      moduleProxy.setupResolvesFromRunRoot({
        specifier: `${candidateName}/package.json`,
        repoRoot: OWN_PACKAGE_ROOT,
        path,
      });
      fsProxy.returns({
        path,
        contents: JSON.stringify(PackageJsonStub({ dependencies: { react: '^19.0.0' } })),
      });
    },

    setupCandidateNoReact: ({ candidateName }: { candidateName: string }): void => {
      const path = `${OWN_PACKAGE_ROOT}/node_modules/${candidateName}/package.json`;
      moduleProxy.setupResolvesFromRunRoot({
        specifier: `${candidateName}/package.json`,
        repoRoot: OWN_PACKAGE_ROOT,
        path,
      });
      fsProxy.returns({
        path,
        contents: JSON.stringify(PackageJsonStub({ dependencies: {} })),
      });
    },

    setupCandidateUnresolvable: ({ candidateName }: { candidateName: string }): void => {
      moduleProxy.setupResolvesNowhere({
        specifier: `${candidateName}/package.json`,
        repoRoot: OWN_PACKAGE_ROOT,
      });
    },
  };
};
