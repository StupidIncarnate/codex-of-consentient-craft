/**
 * PURPOSE: Builds the path ward hands jest for its open-handle findings. Reach for this rather than
 * spelling the path at each call site: the unit and integration checks run one after another in the
 * SAME ward process, so the check type is what keeps the second from reading the first's file.
 *
 * The process id is what keeps two ward runs apart — multi-package mode spawns one child ward per
 * package, so each has its own.
 *
 * USAGE:
 * openHandleReportPathTransformer({tmpdir: '/tmp', checkType: 'unit', processId: 4242});
 * // Returns '/tmp/ward-open-handles-4242-unit.jsonl'
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';
import type { CheckType } from '../../contracts/check-type/check-type-contract';
import { openHandleReportStatics } from '../../statics/open-handle-report/open-handle-report-statics';

export const openHandleReportPathTransformer = ({
  tmpdir,
  checkType,
  processId,
}: {
  tmpdir: AbsoluteFilePath;
  checkType: CheckType;
  processId: number;
}): FilePath =>
  filePathContract.parse(
    `${String(tmpdir)}/${openHandleReportStatics.file.prefix}${String(processId)}-${checkType}${openHandleReportStatics.file.suffix}`,
  );
