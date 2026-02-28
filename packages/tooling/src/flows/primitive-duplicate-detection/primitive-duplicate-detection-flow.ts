/**
 * PURPOSE: Orchestrates primitive duplicate detection by delegating to the run responder
 *
 * USAGE:
 * await PrimitiveDuplicateDetectionFlow({ args: process.argv.slice(2) });
 * // Scans files for duplicate string and regex literals and reports findings to stdout
 */

import { PrimitiveDuplicateDetectionRunResponder } from '../../responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder';

type ResponderParams = Parameters<typeof PrimitiveDuplicateDetectionRunResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof PrimitiveDuplicateDetectionRunResponder>>;

export const PrimitiveDuplicateDetectionFlow = async ({
  args,
}: ResponderParams): Promise<ResponderResult> => PrimitiveDuplicateDetectionRunResponder({ args });
