/**
 * PURPOSE: Validates command name for package.json scripts
 *
 * USAGE:
 * import {commandNameContract} from './command-name-contract';
 * const command = commandNameContract.parse('test');
 * // Returns validated CommandName type
 */

import { z } from 'zod';

export const commandNameContract = z.string().brand<'CommandName'>();

export type CommandName = z.infer<typeof commandNameContract>;
