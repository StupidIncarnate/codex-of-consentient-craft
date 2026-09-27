/**
 * PURPOSE: The one real runtime check for a `WalkedFile` value, branded `'#GatewayWalkedFile'` so
 * every contract that holds one shares this exact check (BR C9). A bare `z.custom<WalkedFile>()`
 * with no check function infers the type but accepts a missing field or any junk at runtime — this
 * calls `isWalkedFile` as the check, so a contract field typed through this schema actually
 * validates the shape instead of only casting to it.
 *
 * USAGE:
 * walkedFileSchema.parse({ path: '/repo/a.jsonl', sizeBytes: 12, modifiedAtMs: 0 });
 * // Returns the same object, typed as WalkedFile & branded '#GatewayWalkedFile'
 */
import { z } from 'zod';
import type { WalkedFile } from './walked-file';
import { isWalkedFile } from './is-walked-file';

export const walkedFileSchema = z
  .custom<WalkedFile>((value) => isWalkedFile(value))
  .brand<'#GatewayWalkedFile'>();
