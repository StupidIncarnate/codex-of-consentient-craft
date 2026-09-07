/**
 * PURPOSE: Hands back a directory holding a production build of a package, minting one only when
 * no build of these exact inputs exists yet. Reach for this instead of starting a dev server for a
 * browser walk: the dev server pays its startup and per-request transform on every run, and this
 * pays a full build once per distinct input set.
 *
 * NOTHING IS EVER WRITTEN INTO A PUBLISHED HASH DIRECTORY, and that is the whole design. A build
 * goes into `.tmp-<pid>` and is `rename`d onto its hash; `rename` onto a non-empty directory is
 * refused by the kernel, so a run that loses the race discards its own copy and serves the winner's
 * — which, having the same inputs, is the same bundle. Writing into the hash directory instead
 * would rewrite files a concurrent run is serving out of, mid-suite.
 *
 * USAGE:
 * await bundleBuildBroker({ packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }) });
 * // Returns { bundleDir, error: null } — or { bundleDir: null, error: null } when the package has
 * // no build script, and { bundleDir: null, error } when its build failed
 */

import {
  childProcessSpawnCaptureAdapter,
  fsExistsSyncAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  errorMessageContract,
  exitCodeContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ErrorMessage } from '@dungeonmaster/shared/contracts';

import { cryptoHashFilesAdapter } from '../../../adapters/crypto/hash-files/crypto-hash-files-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { bundleStatics } from '../../../statics/bundle/bundle-statics';
import { collectInputsLayerBroker } from './collect-inputs-layer-broker';

export const bundleBuildBroker = async ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): Promise<{ bundleDir: AbsoluteFilePath | null; error: ErrorMessage | null }> => {
  const manifestRaw = await fsReadFileAdapter({
    filePath: filePathContract.parse(`${String(packageRoot)}/package.json`),
  }).catch(() => null);

  const scripts =
    manifestRaw === null
      ? undefined
      : ((): ReturnType<typeof packageJsonContract.parse>['scripts'] => {
          try {
            return packageJsonContract.parse(JSON.parse(manifestRaw)).scripts;
          } catch {
            // An unparseable manifest cannot be asked whether it builds. Treated as "no bundle
            // applies" rather than as a failure: the e2e run itself is what grades this package.
            return undefined;
          }
        })();

  // A package with no build script has no bundle to serve, and asking npm to run one prints an
  // error that has nothing to do with the check the caller asked for.
  if (scripts === undefined || !('build' in scripts)) {
    return { bundleDir: null, error: null };
  }

  const { repoRoot, relativePaths } = await collectInputsLayerBroker({ packageRoot });
  const hash = cryptoHashFilesAdapter({ rootPath: repoRoot, relativePaths });

  const bundleParent = `${String(packageRoot)}/${bundleStatics.parentDir}`;
  const bundleDir = absoluteFilePathContract.parse(`${bundleParent}/${String(hash)}`);

  if (fsExistsSyncAdapter({ filePath: filePathContract.parse(String(bundleDir)) })) {
    return { bundleDir, error: null };
  }

  await fsMkdirAdapter({ dirPath: filePathContract.parse(bundleParent) });

  // The pid is what makes this directory this PROCESS's, so two ward runs building the same inputs
  // at once never share a write target. A pid recurs across reboots, so any leftover of the same
  // name is a dead run's and is taken first — building into it would ship both runs' output.
  const tempDir = filePathContract.parse(
    `${bundleParent}/${bundleStatics.tempPrefix}${String(process.pid)}`,
  );
  await fsRmAdapter({ filePath: tempDir, recursive: true, force: true });

  const result = await childProcessSpawnCaptureAdapter({
    command: bundleStatics.buildCommand,
    args: [...bundleStatics.buildArgs, String(tempDir)],
    cwd: packageRoot,
  });

  if (result.exitCode !== exitCodeContract.parse(0)) {
    await fsRmAdapter({ filePath: tempDir, recursive: true, force: true });

    return {
      bundleDir: null,
      error: errorMessageContract.parse(
        `bundle build failed in ${String(packageRoot)}:\n${String(result.output)}`,
      ),
    };
  }

  try {
    await fsRenameAdapter({ fromPath: tempDir, toPath: filePathContract.parse(String(bundleDir)) });
  } catch {
    // A sibling run published this hash first. Its bundle was built from the same inputs as ours,
    // and it may already be serving requests out of it, so ours is discarded rather than merged
    // over the top of it.
    await fsRmAdapter({ filePath: tempDir, recursive: true, force: true });
  }

  return { bundleDir, error: null };
};
