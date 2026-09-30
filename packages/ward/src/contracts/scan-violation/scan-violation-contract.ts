/**
 * PURPOSE: One hit of the scanned rule: the repo-relative file, the line and ESLint's own message.
 * Reach for this over an ESLint message entry when the reader is a hand queue, which needs the
 * location and the wording and nothing else.
 *
 * USAGE:
 * scanViolationContract.parse({ file: 'packages/ward/src/a.ts', line: 3, message: 'Do not do that' });
 * // Returns: ScanViolation validated object
 */

import { z } from '#gateway/npm/zod';

export const scanViolationContract = z
  .object({
    file: z.string().min(1).brand<'ScanViolationFile'>(),
    line: z.number().int().min(0).brand<'ScanViolationLine'>(),
    message: z.string().brand<'ScanViolationMessage'>(),
  })
  .brand<'ScanViolation'>();

export type ScanViolation = z.infer<typeof scanViolationContract>;
