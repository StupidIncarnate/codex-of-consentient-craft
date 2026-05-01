/**
 * PURPOSE: Reads the concatenated content of every non-test startup and bin source file in a package
 *
 * USAGE:
 * const content = readPackageCliContentLayerBroker({ packageRoot: absoluteFilePathContract.parse('/repo/packages/cli') });
 * // Returns concatenated source of `src/startup/*.ts` (non-test) + `bin/*.ts` (non-test), or undefined if none
 *
 * WHEN-TO-USE: During package-type detection so signals like `process.argv` reference or async-namespace
 * export are detected across every entry source — the bin file may parse argv while the startup takes the
 * parsed command as a parameter, or vice versa.
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { isBinSourceFileNameGuard } from '../../../guards/is-bin-source-file-name/is-bin-source-file-name-guard';
import { matchesStartupFileNameGuard } from '../../../guards/matches-startup-file-name/matches-startup-file-name-guard';
import { readFileOptionalLayerBroker } from './read-file-optional-layer-broker';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const readPackageCliContentLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText | undefined => {
  const collected: ContentText[] = [];

  const startupDirPath = absoluteFilePathContract.parse(`${packageRoot}/src/startup`);
  const startupEntries = safeReaddirLayerBroker({ dirPath: startupDirPath });
  for (const entry of startupEntries) {
    if (entry.isDirectory()) continue;
    if (!matchesStartupFileNameGuard({ name: entry.name })) continue;
    const content = readFileOptionalLayerBroker({
      filePath: absoluteFilePathContract.parse(`${startupDirPath}/${entry.name}`),
    });
    if (content !== undefined) collected.push(content);
  }

  const binDirPath = absoluteFilePathContract.parse(`${packageRoot}/bin`);
  const binEntries = safeReaddirLayerBroker({ dirPath: binDirPath });
  for (const entry of binEntries) {
    if (entry.isDirectory()) continue;
    if (!isBinSourceFileNameGuard({ name: entry.name })) continue;
    const content = readFileOptionalLayerBroker({
      filePath: absoluteFilePathContract.parse(`${binDirPath}/${entry.name}`),
    });
    if (content !== undefined) collected.push(content);
  }

  if (collected.length === 0) return undefined;
  const joined = collected.map((c) => String(c)).join('\n\n');
  return joined as ContentText;
};
