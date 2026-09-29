/**
 * PURPOSE: The one real runtime check for a `FileHandle` value, branded `'#GatewayFileHandle'` so
 * every stub and contract that holds one shares this exact check (BR C9). `FileHandle` is an
 * interface whose real instances cannot be constructed outside `fs.promises.open`, so a stub
 * builds a plain object and passes it through this schema; the check requires the three members
 * `readFileFromOffset` calls, so a partial fake missing one fails the parse instead of slipping
 * past a bare `z.custom<FileHandle>()`.
 *
 * USAGE:
 * fileHandleSchema.parse({ fd: 3, stat, read, close });
 * // Returns the same object, typed as FileHandle & branded '#GatewayFileHandle'
 */
import { z } from 'zod';
import type { FileHandle } from 'fs/promises';

export const fileHandleSchema = z
  .custom<FileHandle>(
    (value) =>
      typeof value === 'object' &&
      value !== null &&
      'stat' in value &&
      'read' in value &&
      'close' in value &&
      typeof value.stat === 'function' &&
      typeof value.read === 'function' &&
      typeof value.close === 'function',
  )
  .brand<'#GatewayFileHandle'>();
