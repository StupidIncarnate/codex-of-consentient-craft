/**
 * PURPOSE: Validates and normalizes a spiritmender batch file JSON payload, applying
 * per-item filtering for filePaths and errors while treating optional fields leniently
 *
 * USAGE:
 * batchFileInputContract.parse(JSON.parse(contents));
 * // Returns { filePaths: AbsoluteFilePath[], errors: ErrorMessage[], verificationCommand?, contextInstructions? }
 */

import { z } from 'zod';
import { absoluteFilePathContract, errorMessageContract } from '@dungeonmaster/shared/contracts';

export const batchFileInputContract = z
  .object({
    filePaths: z
      .array(z.unknown())
      .catch([])
      .transform((items) =>
        items.flatMap((fp) => {
          if (typeof fp !== 'string') {
            return [];
          }
          const result = absoluteFilePathContract.safeParse(fp);
          return result.success ? [result.data] : [];
        }),
      )
      .default([]),
    errors: z
      .array(z.unknown())
      .catch([])
      .transform((items) =>
        items.flatMap((err) => {
          if (typeof err !== 'string') {
            return [];
          }
          return [errorMessageContract.parse(err)];
        }),
      )
      .default([]),
    verificationCommand: z
      .string()
      .min(1)
      .brand<'VerificationCommand'>()
      .optional()
      .catch(undefined),
    contextInstructions: z
      .string()
      .min(1)
      .brand<'ContextInstructions'>()
      .optional()
      .catch(undefined),
  })
  .catch({
    filePaths: [],
    errors: [],
    verificationCommand: undefined,
    contextInstructions: undefined,
  });

export type BatchFileInput = z.infer<typeof batchFileInputContract>;
