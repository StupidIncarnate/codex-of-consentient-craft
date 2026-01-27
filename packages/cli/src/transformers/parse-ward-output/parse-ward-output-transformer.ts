/**
 * PURPOSE: Parses ward command output to extract file errors into FileWorkUnit objects
 *
 * USAGE:
 * parseWardOutputTransformer({output: '/src/file.ts:10:5 - error TS123: Missing return type'});
 * // Returns: [{filePath: '/src/file.ts', errors: ['error TS123: Missing return type']}]
 */

import type { AbsoluteFilePath, ErrorMessage } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract, errorMessageContract } from '@dungeonmaster/shared/contracts';

import { fileWorkUnitContract } from '../../contracts/file-work-unit/file-work-unit-contract';
import type { FileWorkUnit } from '../../contracts/file-work-unit/file-work-unit-contract';
import type { WardOutput } from '../../contracts/ward-output/ward-output-contract';

type ErrorsByFile = Map<AbsoluteFilePath, ErrorMessage[]>;

export const parseWardOutputTransformer = ({ output }: { output: WardOutput }): FileWorkUnit[] => {
  if (output.trim() === '') {
    return [];
  }

  const errorsByFile: ErrorsByFile = new Map();

  // Match patterns like:
  // /path/to/file.ts:10:5 - error TS123: message
  // /path/to/file.ts(10,5): error TS123: message
  // /path/to/file.ts:10:5: error message
  const errorPattern = /^(\/[^\s:()]+(?:\.[a-z]+)?)[:[(](\d+)[,:](\d+)\)?[:\s-]+(.+)$/gimu;

  const matches = output.matchAll(errorPattern);

  for (const match of matches) {
    const [, rawFilePath, , , rawErrorMessage] = match;

    if (!rawFilePath || !rawErrorMessage) {
      continue;
    }

    const trimmedPath = rawFilePath.trim();
    const trimmedError = rawErrorMessage.trim();

    if (trimmedPath && trimmedError) {
      const parsedFilePath = absoluteFilePathContract.safeParse(trimmedPath);
      const parsedError = errorMessageContract.safeParse(trimmedError);

      if (parsedFilePath.success && parsedError.success) {
        const existing = errorsByFile.get(parsedFilePath.data) ?? [];
        existing.push(parsedError.data);
        errorsByFile.set(parsedFilePath.data, existing);
      }
    }
  }

  const result: FileWorkUnit[] = [];

  for (const [filePath, errors] of errorsByFile) {
    const workUnit = fileWorkUnitContract.safeParse({
      filePath,
      errors,
    });
    if (workUnit.success) {
      result.push(workUnit.data);
    }
  }

  return result;
};
