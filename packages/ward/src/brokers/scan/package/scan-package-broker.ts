/**
 * PURPOSE: Runs ESLint over one package with the named rule forced to `error`, whatever the repo
 * config says about it (a rule registered `off` included), and returns that rule's hits in hand-queue
 * batches. One package per call keeps a type-aware run inside one process's memory.
 *
 * USAGE:
 * const result = await scanPackageBroker({ projectFolder: ProjectFolderStub(), rootPath: '/home/user/project/src/file.ts', rule: '@dungeonmaster/ban-workspace-export-mocks', targets: [], configFile: ScanConfigFileStub() });
 * // Returns ScanPackageResult { name, violations, batches }
 *
 * ESLint runs from the REPO ROOT with the package folder (or the named files) as its target, under
 * the wrapper config `scanConfigWriteBroker` wrote. `--config` makes the config's base path the
 * cwd, so the root config's own relative globs keep meaning what they mean in a normal root lint;
 * run from the package folder instead, they would resolve against the wrong directory. `--fix` is
 * absent on purpose: a scan leaves the tree as it found it. Exit 0 and 1 are both a scan that ran;
 * anything else (a config that fails to load, an unknown rule, a kill) throws.
 */

import { run } from '#gateway/node/child_process';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { ScanConfigFile } from '../../../contracts/scan-config-file/scan-config-file-contract';
import {
  scanPackageResultContract,
  type ScanPackageResult,
} from '../../../contracts/scan-package-result/scan-package-result-contract';
import { scanStatics } from '../../../statics/scan/scan-statics';
import { eslintJsonToScanViolationsTransformer } from '../../../transformers/eslint-json-to-scan-violations/eslint-json-to-scan-violations-transformer';
import { scanViolationsToBatchesTransformer } from '../../../transformers/scan-violations-to-batches/scan-violations-to-batches-transformer';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';

const PREVIEW_LENGTH = 500;

export const scanPackageBroker = async ({
  projectFolder,
  rootPath,
  rule,
  targets,
  configFile,
}: {
  projectFolder: ProjectFolder;
  rootPath: string;
  rule: string;
  targets: string[];
  configFile: ScanConfigFile;
}): Promise<ScanPackageResult> => {
  const command = binResolveBroker({
    binName: scanStatics.eslint.bin,
    cwd: projectFolder.path,
  });
  const folderRelative = String(projectFolder.path).slice(rootPath.length + 1);
  const args = [
    scanStatics.eslint.configFlag,
    String(configFile.path),
    ...scanStatics.eslint.formatArgs,
    ...(targets.length > 0
      ? targets.map((target) => `${folderRelative}/${target}`)
      : [folderRelative]),
  ];

  const result = await run({ command, args, cwd: rootPath }).catch((error: unknown) => {
    throw new Error(`Scan of ${projectFolder.name} could not start ${command}: ${String(error)}`, {
      cause: error,
    });
  });

  const ran =
    result.signal === null &&
    (result.exitCode === scanStatics.exitCodes.clean ||
      result.exitCode === scanStatics.exitCodes.violationsFound);

  if (!ran) {
    throw new Error(
      `Scan of ${projectFolder.name} for ${rule} failed (exit ${result.exitCode}, signal ${String(result.signal)}): ${result.output.slice(0, PREVIEW_LENGTH)}`,
    );
  }

  const violations =
    result.exitCode === scanStatics.exitCodes.clean
      ? []
      : eslintJsonToScanViolationsTransformer({ jsonOutput: result.output, rule, rootPath });

  return scanPackageResultContract.parse({
    name: projectFolder.name,
    violations: violations.length,
    batches: scanViolationsToBatchesTransformer({ violations }),
  });
};
