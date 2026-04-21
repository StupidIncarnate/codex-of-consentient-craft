/**
 * PURPOSE: CLI entry point that scans TypeScript files for duplicate string and regex literals.
 *
 * USAGE:
 * await StartPrimitiveDuplicateDetection();
 * // Delegates to PrimitiveDuplicateDetectionFlow with process.argv args
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { PrimitiveDuplicateDetectionFlow } from '../flows/primitive-duplicate-detection/primitive-duplicate-detection-flow';

const COMMAND_LINE_ARG_START_INDEX = 2;

export const StartPrimitiveDuplicateDetection = async (): Promise<AdapterResult> =>
  PrimitiveDuplicateDetectionFlow({ args: process.argv.slice(COMMAND_LINE_ARG_START_INDEX) });
