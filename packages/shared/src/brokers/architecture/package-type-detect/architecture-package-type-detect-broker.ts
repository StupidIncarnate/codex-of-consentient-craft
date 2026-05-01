/**
 * PURPOSE: Detects the architecture type of a package by inspecting its filesystem layout and package.json
 *
 * USAGE:
 * const type = await architecturePackageTypeDetectBroker({ packageRoot: absoluteFilePathContract.parse('/repo/packages/server') });
 * // Returns: 'http-backend' as PackageType
 *
 * WHEN-TO-USE: During project-map generation to determine which headline renderer to use for each package
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
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
}): Promise<PackageType> => {
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

  return Promise.resolve(packageType);
};
