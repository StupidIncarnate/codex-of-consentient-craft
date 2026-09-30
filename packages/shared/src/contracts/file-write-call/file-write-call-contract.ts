/**
 * PURPOSE: Defines a single file-write gateway call site (`appendFile`, `writeFile`, `ensureDir`)
 * extracted from source text; `adapter` carries the gateway's exported name
 *
 * USAGE:
 * fileWriteCallContract.parse({ adapter: 'writeFile', filePathArg: '/quest.json' });
 * // Returns validated FileWriteCall
 */

import { z } from '#gateway/npm/zod';

export const fileWriteCallContract = z.object({
  adapter: z.string().brand<'FileWriteCallAdapter'>(),
  filePathArg: z.string().brand<'FileWriteCallFilePathArg'>(),
});

export type FileWriteCall = z.infer<typeof fileWriteCallContract>;
