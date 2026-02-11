/**
 * PURPOSE: Builds spiritmender work units from file paths and optional error messages
 *
 * USAGE:
 * filePathsToSpiritmenderWorkUnitsTransformer({ filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })], errors: [] });
 * // Returns WorkUnit[] with role 'spiritmender', one per file path
 */

import {
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
} from '@dungeonmaster/shared/contracts';

import { workUnitContract } from '../../contracts/work-unit/work-unit-contract';
import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';

export const filePathsToSpiritmenderWorkUnitsTransformer = ({
  filePaths,
  errors,
}: {
  filePaths: AbsoluteFilePath[];
  errors: ErrorMessage[];
}): WorkUnit[] =>
  filePaths.map((filePath) =>
    workUnitContract.parse({
      role: 'spiritmender',
      filePaths: [filePath],
      errors: errors.length > 0 ? [errorMessageContract.parse(errors.join('\n'))] : [],
    }),
  );
