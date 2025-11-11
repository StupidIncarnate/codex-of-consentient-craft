/**
 * PURPOSE: Zod schema for command execution output (string or Buffer)
 *
 * USAGE:
 * const output = commandOutputContract.parse('command output');
 * // Returns branded CommandOutput string
 */
import { z } from 'zod';

export const commandOutputContract = z.string().brand<'CommandOutput'>();
export type CommandOutput = z.infer<typeof commandOutputContract>;
