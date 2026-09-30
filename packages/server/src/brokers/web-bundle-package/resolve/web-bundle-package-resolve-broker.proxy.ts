import { PackageJsonStub } from '@dungeonmaster/shared/contracts/package-json/package-json.stub';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
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
} => {
  const cwdProxy = cwdResolveBrokerProxy();
  cwdProxy.setupProjectRootFoundAtStart({ startPath: OWN_PACKAGE_ROOT });
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

    // candidateName must be a REAL, resolvable package specifier — require.resolve runs for real
    // in the broker (Node's own module resolution is what genuinely locates a sibling scoped
    // package; nothing here can honestly fake that) — a workspace package with no `exports` field
    // restricting its subpaths, e.g. '@dungeonmaster/web'. The content returned is
    // test-controlled.
    setupCandidateReact: ({ candidateName }: { candidateName: string }): void => {
      fsProxy.returns({
        path: require.resolve(`${candidateName}/package.json`),
        contents: JSON.stringify(PackageJsonStub({ dependencies: { react: '^19.0.0' } })),
      });
    },

    setupCandidateNoReact: ({ candidateName }: { candidateName: string }): void => {
      fsProxy.returns({
        path: require.resolve(`${candidateName}/package.json`),
        contents: JSON.stringify(PackageJsonStub({ dependencies: {} })),
      });
    },
  };
};
