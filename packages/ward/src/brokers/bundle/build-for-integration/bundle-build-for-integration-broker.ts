/**
 * PURPOSE: Hands an integration run the same content-hashed build an e2e run gets, but only for a
 * package whose own package.json sets `"ward": { "integrationBuild": true }`. Reach for this, not
 * bundleBuildBroker, from the integration check: most packages' integration tests read source and
 * need no build, and paying one for them would slow every run for nothing.
 *
 * The build itself is bundleBuildBroker's, so an integration run and an e2e run of the same inputs
 * share one `.ward/bundle/<hash>/` directory, and neither ever writes into a directory the other is
 * reading.
 *
 * USAGE:
 * await bundleBuildForIntegrationBroker({ packageRoot: '/repo/packages/cli' });
 * // Returns { bundleDir: null, error: null } when the package does not opt in,
 * // { bundleDir, error: null } once its bundle exists, and { bundleDir: null, error } when the
 * // setting is misspelt, the package has no build script, or its build failed
 */

import { readFile } from '#gateway/node/fs__promises';

import { bundleBuildResultContract } from '../../../contracts/bundle-build-result/bundle-build-result-contract';
import type { BundleBuildResult } from '../../../contracts/bundle-build-result/bundle-build-result-contract';
import { packageWardSettingsContract } from '../../../contracts/package-ward-settings/package-ward-settings-contract';
import { bundleBuildBroker } from '../build/bundle-build-broker';

export const bundleBuildForIntegrationBroker = async ({
  packageRoot,
}: {
  packageRoot: string;
}): Promise<BundleBuildResult> => {
  const manifestPath = `${packageRoot}/package.json`;
  const manifestRaw = await readFile(manifestPath).catch(() => null);

  const manifest = ((): unknown => {
    if (manifestRaw === null) {
      return {};
    }
    try {
      return JSON.parse(manifestRaw);
    } catch {
      // An unparseable manifest cannot opt in to anything. The integration run itself is what
      // reports a broken package.json, so it is treated here as "no build asked for".
      return {};
    }
  })();

  const settings = packageWardSettingsContract.safeParse(manifest);

  if (!settings.success) {
    const problems = settings.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    return bundleBuildResultContract.parse({
      bundleDir: null,
      error: `${manifestPath} has an invalid "ward" setting (${problems}). The only key ward reads there is "integrationBuild", and it takes true or false.`,
    });
  }

  if (settings.data.ward?.integrationBuild !== true) {
    return bundleBuildResultContract.parse({ bundleDir: null, error: null });
  }

  const bundle = await bundleBuildBroker({ packageRoot });

  // bundleBuildBroker answers "no bundle, no error" for a package with no build script, which is
  // right for e2e. Here the package asked for a build by name, so silence would leave its tests
  // reading a bundle directory that was never set.
  if (bundle.bundleDir === null && bundle.error === null) {
    return bundleBuildResultContract.parse({
      bundleDir: null,
      error: `${manifestPath} sets "ward": { "integrationBuild": true } but has no "build" script. Add a "build" script that accepts --outDir <dir> and writes its whole output there, or remove "integrationBuild".`,
    });
  }

  return bundle;
};
