/**
 * PURPOSE: The one real runtime check for a `ChildProcess` value, branded `'#GatewayChildProcess'`
 * so every contract that holds one shares this exact check (BR C9). `z.instanceof` is the right
 * shape for a class (unlike `WalkedFile`'s plain data, which needs `z.custom` with a check) — it
 * rejects a missing field or a non-`ChildProcess` value that a bare `z.custom<ChildProcess>()` would
 * silently accept.
 *
 * USAGE:
 * childProcessSchema.parse(spawn('true'));
 * // Returns the same ChildProcess instance, typed as ChildProcess & branded '#GatewayChildProcess'
 */
import { z } from 'zod';
import { ChildProcess } from 'child_process';

export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();
