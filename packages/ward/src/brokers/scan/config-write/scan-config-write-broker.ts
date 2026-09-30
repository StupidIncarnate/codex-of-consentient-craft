/**
 * PURPOSE: Writes the wrapper ESLint config for one scan into a fresh directory under the OS temp
 * dir and returns where it went. Scratch stays out of the repo: ward grades untracked files on
 * `--uncommitted`, so a wrapper a killed scan left in the tree would be linted by the next run.
 *
 * USAGE:
 * const file = scanConfigWriteBroker({ rule: '@dungeonmaster/ban-workspace-export-mocks', rootPath: '/repo' });
 * // Returns ScanConfigFile { directory: '/tmp/ward-scan-a1B2c3', path: '/tmp/ward-scan-a1B2c3/eslint.scan.config.cjs' }
 */

import { mkdtempSync, writeFileSync } from '#gateway/node/fs';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import {
  scanConfigFileContract,
  type ScanConfigFile,
} from '../../../contracts/scan-config-file/scan-config-file-contract';
import { scanStatics } from '../../../statics/scan/scan-statics';
import { scanEslintConfigSourceTransformer } from '../../../transformers/scan-eslint-config-source/scan-eslint-config-source-transformer';
import { tmpdirFindBroker } from '../../tmpdir/find/tmpdir-find-broker';

export const scanConfigWriteBroker = ({
  rule,
  rootPath,
}: {
  rule: string;
  rootPath: string;
}): ScanConfigFile => {
  const directory = mkdtempSync(`${tmpdirFindBroker()}/${scanStatics.config.tempDirPrefix}`);
  const path = `${directory}/${scanStatics.config.wrapperName}`;

  writeFileSync(
    path,
    scanEslintConfigSourceTransformer({
      rule,
      rootConfigPath: `${rootPath}/${locationsStatics.repoRoot.eslintConfig[1]}`,
    }),
  );

  return scanConfigFileContract.parse({ directory, path });
};
