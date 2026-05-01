/**
 * PURPOSE: Lists rule domain folders under a package's src/brokers/rule/ directory,
 * returning one entry per domain folder that contains a rule broker entry file.
 * Each returned path is the entry file for that rule.
 *
 * USAGE:
 * const files = listRuleFilesLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/eslint-plugin'),
 * });
 * // Returns AbsoluteFilePath[] — one *-broker.ts entry file per rule domain
 *
 * WHEN-TO-USE: eslint-plugin headline broker collecting rule entries for grouping
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listRuleFilesLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const ruleBaseDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/brokers/rule`);

  const domainDirs = safeReaddirLayerBroker({ dirPath: ruleBaseDir });

  const results: AbsoluteFilePath[] = [];

  for (const dir of domainDirs) {
    if (!dir.isDirectory()) continue;

    const domainPath = absoluteFilePathContract.parse(`${String(ruleBaseDir)}/${dir.name}`);
    const files = safeReaddirLayerBroker({ dirPath: domainPath });

    // Pick the entry file for this rule domain: the file whose stem matches
    // `rule-<domain-name>-broker` (i.e. the canonical entry file for the domain).
    for (const file of files) {
      if (!file.isFile()) continue;
      if (!file.name.endsWith('-broker.ts')) continue;

      const filePath = absoluteFilePathContract.parse(`${String(domainPath)}/${file.name}`);

      if (!isNonTestFileGuard({ filePath })) continue;

      // Only include the entry broker file (no -layer- in name)
      if (file.name.includes('-layer-')) continue;

      results.push(filePath);
      break; // one entry file per domain folder
    }
  }

  return results;
};
