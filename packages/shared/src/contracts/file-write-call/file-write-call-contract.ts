/**
 * PURPOSE: Defines a single file-write adapter call site extracted from source text
 *
 * USAGE:
 * fileWriteCallContract.parse({ adapter: 'fsWriteFileAdapter', filePathArg: '/quest.json' });
 * // Returns validated FileWriteCall
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const fileWriteCallContract = z.object({
  adapter: contentTextContract,
  filePathArg: contentTextContract,
});

export type FileWriteCall = z.infer<typeof fileWriteCallContract>;
