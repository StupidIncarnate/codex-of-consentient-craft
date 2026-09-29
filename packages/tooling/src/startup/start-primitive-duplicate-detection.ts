/**
 * PURPOSE: CLI entry point that scans TypeScript files for duplicate string and regex literals.
 *
 * USAGE:
 * await StartPrimitiveDuplicateDetection();
 * // Delegates to PrimitiveDuplicateDetectionFlow with process.argv args
 */

import { PrimitiveDuplicateDetectionFlow } from '../flows/primitive-duplicate-detection/primitive-duplicate-detection-flow';
import { argv } from '#gateway/node/process';

const COMMAND_LINE_ARG_START_INDEX = 2;

export const StartPrimitiveDuplicateDetection = async (): Promise<void> =>
  PrimitiveDuplicateDetectionFlow({ args: argv.slice(COMMAND_LINE_ARG_START_INDEX) });
