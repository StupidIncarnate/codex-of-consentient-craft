/**
 * PURPOSE: Reads the first non-test startup file (start-*.ts) from a package's
 * startup/ directory, returning undefined when no startup file exists.
 *
 * USAGE:
 * const source = readStartupFileLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/ward'),
 * });
 * // Returns ContentText of the first startup file, or undefined if none found
 *
 * WHEN-TO-USE: cli-tool headline broker reading startup source for subcommand extraction
 */

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const readStartupFileLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText | undefined => {
  const startupDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/startup`);
  const entries = safeReaddirLayerBroker({ dirPath: startupDir });

  const startupFile = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.startsWith('start-') && name.endsWith('.ts'))
    .filter((name) =>
      isNonTestFileGuard({
        filePath: absoluteFilePathContract.parse(`${String(startupDir)}/${name}`),
      }),
    )
    .sort()
    .at(0);

  if (startupFile === undefined) {
    return undefined;
  }

  const filePath = absoluteFilePathContract.parse(`${String(startupDir)}/${startupFile}`);
  try {
    return fsReadFileSyncAdapter({ filePath });
  } catch {
    return undefined;
  }
};
