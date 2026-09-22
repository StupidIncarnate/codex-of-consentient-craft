import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { ContentTextStub, PackageJsonStub } from '@dungeonmaster/shared/contracts';
import { cwdResolveBrokerProxy, fsReadFileSyncAdapterProxy } from '@dungeonmaster/shared/testing';

// The broker resolves its OWN package.json by walking up from its own __dirname via
// cwdResolveBroker. This proxy file sits beside the broker file, so __dirname computed here is
// the identical starting point the broker's own call resolves from — staging the walk to land on
// that same directory keeps the two in lockstep without touching the real filesystem.
const OWN_PACKAGE_ROOT = __dirname;
const OWN_PACKAGE_JSON_PATH = absoluteFilePathContract.parse(`${OWN_PACKAGE_ROOT}/package.json`);

export const webBundlePackageResolveBrokerProxy = (): {
  setupOwnDependencies: (params: { dependencyNames: readonly string[] }) => void;
  setupCandidateReact: (params: { candidateName: string }) => void;
  setupCandidateNoReact: (params: { candidateName: string }) => void;
} => {
  const cwdProxy = cwdResolveBrokerProxy();
  cwdProxy.setupProjectRootFoundAtStart({ startPath: OWN_PACKAGE_ROOT });
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    // A candidate name not in this list is never probed at all — Object.keys drives the whole
    // walk — which is how the "no candidates" case is described.
    setupOwnDependencies: ({ dependencyNames }: { dependencyNames: readonly string[] }): void => {
      const dependencies = Object.fromEntries(dependencyNames.map((name) => [name, '*']));
      fsProxy.returns({
        filePath: OWN_PACKAGE_JSON_PATH,
        content: ContentTextStub({ value: JSON.stringify(PackageJsonStub({ dependencies })) }),
      });
    },

    // candidateName must be a REAL, resolvable package specifier — require.resolve runs for real
    // in the broker (Node's own module resolution is what genuinely locates a sibling scoped
    // package; nothing here can honestly fake that) — a workspace package with no `exports` field
    // restricting its subpaths, e.g. '@dungeonmaster/web'. The content returned is
    // test-controlled.
    setupCandidateReact: ({ candidateName }: { candidateName: string }): void => {
      fsProxy.returns({
        filePath: absoluteFilePathContract.parse(require.resolve(`${candidateName}/package.json`)),
        content: ContentTextStub({
          value: JSON.stringify(PackageJsonStub({ dependencies: { react: '^19.0.0' } })),
        }),
      });
    },

    setupCandidateNoReact: ({ candidateName }: { candidateName: string }): void => {
      fsProxy.returns({
        filePath: absoluteFilePathContract.parse(require.resolve(`${candidateName}/package.json`)),
        content: ContentTextStub({ value: JSON.stringify(PackageJsonStub({ dependencies: {} })) }),
      });
    },
  };
};
