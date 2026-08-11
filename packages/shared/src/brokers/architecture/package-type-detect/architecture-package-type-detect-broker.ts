/**
 * PURPOSE: Reads a package's filesystem layout and package.json once and reports EVERY kind its
 * signals support, because the priority table can only ever name one winner and a package that
 * serves HTTP while also rendering widgets is honestly both. The winner leads, so a caller wanting
 * the single label for a headline or a colour takes the first element and a caller deciding what a
 * package is ELIGIBLE for reads the whole list — deriving eligibility from the winner alone is what
 * silently costs a hono-serving UI package its browser coverage.
 *
 * USAGE:
 * const types = await architecturePackageTypeDetectBroker({ packageRoot: absoluteFilePathContract.parse('/repo/packages/server') });
 * // Returns: ['http-backend'] — or ['http-backend', 'frontend-react'] when widgets+react sit behind the hono adapter
 *
 * WHEN-TO-USE: During project-map generation to determine which headline renderer to use for each
 *   package, and at quest-save time to stamp each declared package entry's kinds
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import { packageBrowserTypeTransformer } from '../../../transformers/package-browser-type/package-browser-type-transformer';
import { readFileOptionalLayerBroker } from './read-file-optional-layer-broker';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { readPackageCliContentLayerBroker } from './read-package-cli-content-layer-broker';
import { findFirstFlowFileRecursiveLayerBroker } from './find-first-flow-file-recursive-layer-broker';
import { hasResponderCreateLayerBroker } from './has-responder-create-layer-broker';
import { dirExistsInParentLayerBroker } from './dir-exists-in-parent-layer-broker';
import { binEntryCountLayerBroker } from './bin-entry-count-layer-broker';
import { detectPackageTypeLayerBroker } from './detect-package-type-layer-broker';

export const architecturePackageTypeDetectBroker = async ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): Promise<[PackageType, ...PackageType[]]> => {
  // Read and parse package.json
  const packageJsonPath = absoluteFilePathContract.parse(`${packageRoot}/package.json`);
  const packageJsonRaw = readFileOptionalLayerBroker({ filePath: packageJsonPath });
  const packageJson = packageJsonContract.parse(
    packageJsonRaw === undefined ? {} : (JSON.parse(String(packageJsonRaw)) as unknown),
  );

  // List top-level dirs in src/
  const srcPath = absoluteFilePathContract.parse(`${packageRoot}/src`);
  const srcEntries = safeReaddirLayerBroker({ dirPath: srcPath });
  const srcDirNames = srcEntries.filter((e) => e.isDirectory()).map((e) => e.name);

  // List dirs in src/adapters/ ([] if absent)
  const adaptersPath = absoluteFilePathContract.parse(`${packageRoot}/src/adapters`);
  const adapterEntries = safeReaddirLayerBroker({ dirPath: adaptersPath });
  const adapterDirNames = adapterEntries.filter((e) => e.isDirectory()).map((e) => e.name);

  // Read concatenated content from every non-test startup + bin source file. Combining them lets
  // detection signals (process.argv reference, async-namespace export) surface even when argv parsing
  // lives in a thin bin entry while the startup takes the parsed command as a parameter.
  const startupFileContent = readPackageCliContentLayerBroker({ packageRoot });

  // Find and read first flow file content (recursive search)
  const flowsDirPath = absoluteFilePathContract.parse(`${packageRoot}/src/flows`);
  const flowFilePath = findFirstFlowFileRecursiveLayerBroker({ dirPath: flowsDirPath });
  const flowFileContent =
    flowFilePath === undefined
      ? undefined
      : readFileOptionalLayerBroker({ filePath: flowFilePath });

  // Folder presence checks via parent-listing
  const respondersDirPath = absoluteFilePathContract.parse(`${packageRoot}/src/responders`);
  const brokersDirPath = absoluteFilePathContract.parse(`${packageRoot}/src/brokers`);

  const hasResponderHook = dirExistsInParentLayerBroker({
    parentDirPath: respondersDirPath,
    dirName: 'hook',
  });

  const hasBrokersRule = dirExistsInParentLayerBroker({
    parentDirPath: brokersDirPath,
    dirName: 'rule',
  });

  const hasFlowsDir = srcDirNames.includes('flows');
  const hasRespondersDir = srcDirNames.includes('responders');
  const hasStateDir = srcDirNames.includes('state');

  const hasResponderCreate = hasResponderCreateLayerBroker({ respondersDirPath });

  const exportsHasDot = packageJson.exports === undefined ? false : '.' in packageJson.exports;

  const binEntryCount = binEntryCountLayerBroker({ packageJson });

  const packageType = detectPackageTypeLayerBroker({
    adapterDirNames,
    srcDirNames,
    packageJson,
    startupFileContent: startupFileContent === undefined ? undefined : String(startupFileContent),
    flowFileContent: flowFileContent === undefined ? undefined : String(flowFileContent),
    hasResponderHook,
    hasBrokersRule,
    hasFlowsDir,
    hasRespondersDir,
    hasStateDir,
    hasResponderCreate,
    exportsHasDot,
    binEntryCount,
  });

  // The browser question is asked a second time on purpose: the table above returns on the FIRST
  // rule that matches, so a package whose hono or MCP adapter outranks its widgets folder never
  // reaches the rule that would have named it browser-reachable.
  const browserPackageType = packageBrowserTypeTransformer({
    adapterDirNames,
    srcDirNames,
    packageJson,
  });

  return Promise.resolve(
    browserPackageType === undefined || browserPackageType === packageType
      ? [packageType]
      : [packageType, browserPackageType],
  );
};
