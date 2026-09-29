/**
 * PURPOSE: Scans every workspace package (or only the ones the given paths reach) for one rule and
 * assembles the report `ward scan` prints. Packages are scanned strictly one after another: a
 * type-aware ESLint run over a whole repo has run out of memory, and one package at a time is the
 * bound that avoids it.
 *
 * USAGE:
 * const report = await scanRunBroker({ config: ScanConfigStub(), rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns ScanReport { rule, packages: [{ name, violations, batches }] }
 */

import { rmSync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { promisePoolTransformer } from '@dungeonmaster/shared/transformers';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { ScanConfig } from '../../../contracts/scan-config/scan-config-contract';
import {
  scanReportContract,
  type ScanReport,
} from '../../../contracts/scan-report/scan-report-contract';
import { scanFolderTargetsTransformer } from '../../../transformers/scan-folder-targets/scan-folder-targets-transformer';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { scanConfigWriteBroker } from '../config-write/scan-config-write-broker';
import { scanPackageBroker } from '../package/scan-package-broker';

const ONE_PACKAGE_AT_A_TIME = 1;

export const scanRunBroker = async ({
  config,
  rootPath,
}: {
  config: ScanConfig;
  rootPath: AbsoluteFilePath;
}): Promise<ScanReport> => {
  const projectFolders = await workspaceDiscoverBroker({ rootPath });

  if (projectFolders === null) {
    throw new Error(`scan needs an npm-workspaces root; ${String(rootPath)} declares none`);
  }

  const scoped = projectFolders
    .map((projectFolder: ProjectFolder) => ({
      projectFolder,
      ...scanFolderTargetsTransformer({ paths: config.paths, projectFolder, rootPath }),
    }))
    .filter(({ inScope }) => inScope);

  const configFile = scanConfigWriteBroker({ rule: config.rule, rootPath });

  // The wrapper's temp directory goes whether the scan finished or threw.
  const packages = await promisePoolTransformer({
    items: scoped,
    concurrency: ONE_PACKAGE_AT_A_TIME,
    handler: async ({ projectFolder, targets }) =>
      scanPackageBroker({
        projectFolder,
        rootPath,
        rule: config.rule,
        targets: targets.map(String),
        configFile,
      }),
  }).finally(() => {
    rmSync(String(configFile.directory), { recursive: true, force: true });
  });

  return scanReportContract.parse({ rule: config.rule, packages });
};
