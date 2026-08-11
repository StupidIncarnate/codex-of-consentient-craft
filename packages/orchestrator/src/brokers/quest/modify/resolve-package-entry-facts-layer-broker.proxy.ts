import { FileNameStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import {
  architecturePackageTypeDetectBrokerProxy,
  pathDirnameAdapterProxy,
  pathResolveAdapterProxy,
} from '@dungeonmaster/shared/testing';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';

export const resolvePackageEntryFactsLayerBrokerProxy = (): {
  setupLocationExists: (params: { packageRoot: string }) => void;
  setupDetectedPackage: (params: {
    packageRoot: string;
    srcDirNames?: readonly string[];
    adapterDirNames?: readonly string[];
    packageJsonContent?: string;
  }) => void;
  setupUndetectablePackage: (params: { packageRoot: string }) => void;
  setupWorkspace: (params: {
    root: string;
    packages: readonly { dirName: string; manifest?: unknown; raw?: string }[];
  }) => void;
  setupUnreadableRoot: (params: { root: string }) => void;
} => {
  const accessProxy = fsIsAccessibleAdapterProxy();
  accessProxy.defaultsToNotFound();
  pathDirnameAdapterProxy();
  // Left on its real `path.resolve` passthrough: anchoring a declared location on the quest's own
  // project root is the behaviour under test, so the broker computes every address for real and the
  // setups below name the absolute result they expect it to reach.
  pathResolveAdapterProxy();
  const detectProxy = architecturePackageTypeDetectBrokerProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    // `packageRoot` is the ABSOLUTE root the declared location resolves to under the quest's own
    // project root — the address fs.access is really handed. Every other address answers "absent".
    setupLocationExists: ({ packageRoot }: { packageRoot: string }): void => {
      accessProxy.resolves({ filePath: FilePathStub({ value: packageRoot }) });
    },

    // Describes the on-disk shape the detector's priority table classifies at ONE absolute package
    // root. Exactly one package may be described per test — the detector's readdir/readFile staging
    // is a single catch-all implementation, so a second call replaces the first.
    setupDetectedPackage: ({
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
      detectProxy.setupPackage({
        packageRoot,
        srcDirNames,
        adapterDirNames,
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
        dirPath: root,
        files: packages.map(({ dirName }) => FileNameStub({ value: dirName })),
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
          continue;
        }
        accessProxy.resolves({ filePath: manifestPath });
        readFileProxy.resolves({ filePath: manifestPath, content: body });
      }
    },

    setupUnreadableRoot: ({ root }: { root: string }): void => {
      readdirProxy.throws({
        dirPath: root,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
  };
};
