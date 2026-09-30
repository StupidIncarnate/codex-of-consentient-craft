/**
 * PURPOSE: Resolves the display token for a file by reading its source and extracting the
 * actual exported identifier (e.g. `questLoadBroker`, `HomeContentWidget`,
 * `useQuestQueueBinding`). Falls back to the kebab basename when the source is missing or
 * has no extractable export.
 *
 * USAGE:
 * architectureExportNameResolveBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/brokers/quest/load/quest-load-broker.ts'),
 * });
 * // Returns ContentText 'questLoadBroker' (when the file exports `export const questLoadBroker = ...`)
 *
 * WHEN-TO-USE: Project-map renderers that want to surface the actual JS export identifier
 * instead of the file's kebab basename or its slash-path
 */

import { readFileSync } from '#gateway/node/fs';
import { exportNameExtractTransformer } from '../../../transformers/export-name-extract/export-name-extract-transformer';
import { filePathToSymbolNameTransformer } from '../../../transformers/file-path-to-symbol-name/file-path-to-symbol-name-transformer';

export const architectureExportNameResolveBroker = ({
  filePath,
}: {
  filePath: string;
}): string => {
  const fallback = filePathToSymbolNameTransformer({ filePath });
  try {
    const source = readFileSync(filePath);
    const extracted = exportNameExtractTransformer({ source });
    return extracted ?? fallback;
  } catch {
    return fallback;
  }
};
