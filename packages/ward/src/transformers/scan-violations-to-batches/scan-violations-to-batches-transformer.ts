/**
 * PURPOSE: Groups violations into hand-queue batches of whole files. A file's hits stay together
 * and the files are spread as evenly as the size cap allows, so no batch falls under two files
 * unless the package has only one file with hits.
 *
 * USAGE:
 * scanViolationsToBatchesTransformer({ violations: [ScanViolationStub()] });
 * // Returns: [[{ file: 'packages/ward/src/example.ts', line: 1, message: 'Example violation' }]]
 */

import type { ScanPackageResult } from '../../contracts/scan-package-result/scan-package-result-contract';
import type { ScanViolation } from '../../contracts/scan-violation/scan-violation-contract';
import { scanStatics } from '../../statics/scan/scan-statics';

export const scanViolationsToBatchesTransformer = ({
  violations,
}: {
  violations: ScanViolation[];
}): ScanPackageResult['batches'] => {
  const hitsByFile = new Map<ScanViolation['file'], ScanViolation[]>();
  for (const violation of violations) {
    hitsByFile.set(violation.file, [...(hitsByFile.get(violation.file) ?? []), violation]);
  }

  const fileGroups = [...hitsByFile.values()];
  const batchCount = Math.ceil(fileGroups.length / scanStatics.batch.maxFiles);
  const baseSize = Math.floor(fileGroups.length / Math.max(batchCount, 1));
  const largerBatches = fileGroups.length - baseSize * batchCount;

  return Array.from({ length: batchCount }, (_unused, batchIndex) => {
    const start = batchIndex * baseSize + Math.min(batchIndex, largerBatches);
    const size = baseSize + (batchIndex < largerBatches ? 1 : 0);
    return fileGroups.slice(start, start + size).flat();
  });
};
