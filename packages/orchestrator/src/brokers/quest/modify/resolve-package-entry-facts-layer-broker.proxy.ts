import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { dirname, resolve } from '#gateway/node/path';

import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { architecturePackageTypeDetectBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/package-type-detect/architecture-package-type-detect-broker.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const resolvePackageEntryFactsLayerBrokerProxy = (): {
  setupLocationExists: (params: { packageRoot: string }) => void;
  setupLocationMissing: (params: { packageRoot: string }) => void;
  setupDetectedPackage: (params: {
    packageRoot: string;
    srcDirNames?: readonly string[];
    packageJsonContent?: string;
  }) => void;
  setupUndetectablePackage: (params: { packageRoot: string }) => void;
  setupWorkspace: (params: {
    root: string;
    packages: readonly { dirName: string; manifest?: unknown; raw?: string }[];
  }) => void;
  setupUnreadableRoot: (params: { root: string }) => void;
} => {
  const accessProxy = pathExistsProxy();
  // Both left on a real passthrough default: anchoring a declared location on the quest's own
  // project root (`resolve`) and finding a location's own parent workspace root (`dirname`) are the
  // behaviour under test, so the broker computes every address for real and the setups below name
  // the absolute result they expect it to reach.
  const realPath = requireActual<{ dirname: typeof dirname; resolve: typeof resolve }>({
    module: 'path',
  });
  registerMock({ fn: dirname })
    .calledWith([])
    .implement((inputPath: never) => realPath.dirname(inputPath));
  registerMock({ fn: resolve })
    .calledWith([])
    .implement((...segments: never[]) => realPath.resolve(...segments));
  const detectProxy = architecturePackageTypeDetectBrokerProxy();
  const readdirProxy = readdirSyncProxy();
  const readFileHandle = readFileIfExistsProxy();

  return {
    // `packageRoot` is the ABSOLUTE root the declared location resolves to under the quest's own
    // project root — the address fs.access is really handed. Every location the quest declares needs
    // its own staging, present or missing: an address nothing describes throws.
    setupLocationExists: ({ packageRoot }: { packageRoot: string }): void => {
      accessProxy.present({ path: packageRoot });
    },

    setupLocationMissing: ({ packageRoot }: { packageRoot: string }): void => {
      accessProxy.missing({ path: packageRoot });
    },

    // Describes the on-disk shape the detector's priority table classifies at ONE absolute package
    // root. Exactly one package may be described per test — the detector's readdir/readFile staging
    // is a single catch-all implementation, so a second call replaces the first.
    setupDetectedPackage: ({
      packageRoot,
      srcDirNames = [],
      packageJsonContent = '{}',
    }: {
      packageRoot: string;
      srcDirNames?: readonly string[];
      packageJsonContent?: string;
    }): void => {
      detectProxy.setupPackage({
        packageRoot,
        srcDirNames,
        packageJsonContent,
      });
    },

    // A root that exists but whose own package.json is not parseable JSON: the detector throws and
    // the entry keeps whatever type its author declared.
    setupUndetectablePackage: ({ packageRoot }: { packageRoot: string }): void => {
      detectProxy.setupPackage({ packageRoot, packageJsonContent: '{ not json' });
    },

    // Describes one workspace root — the parent of a declared location, so an absolute path: the
    // directory names `readdirSync` returns for it, and per sibling what `readFile` hands back for
    // its package.json. A sibling given `manifest` is readable JSON; one given `raw` is readable but
    // arbitrary text; one given neither is listed by readdir yet has no accessible manifest, which
    // is the "not a package" case.
    setupWorkspace: ({
      root,
      packages,
    }: {
      root: string;
      packages: readonly { dirName: string; manifest?: unknown; raw?: string }[];
    }): void => {
      readdirProxy.returns({
        path: root,
        names: packages.map(({ dirName }) => FileNameStub({ value: dirName })),
      });

      for (const entry of packages) {
        const manifestPath = FilePathStub({ value: `${root}/${entry.dirName}/package.json` });
        const body =
          entry.raw === undefined
            ? entry.manifest === undefined
              ? undefined
              : JSON.stringify(entry.manifest)
            : entry.raw;
        if (body === undefined) {
          readFileHandle.missing({ path: manifestPath });
          continue;
        }
        readFileHandle.returns({ path: manifestPath, contents: body });
      }
    },

    setupUnreadableRoot: ({ root }: { root: string }): void => {
      readdirProxy.throws({
        path: root,
        error: FileMissingErrorStub({ path: root }),
      });
    },
  };
};
