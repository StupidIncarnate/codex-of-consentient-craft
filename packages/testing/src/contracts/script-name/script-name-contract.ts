/**
 * PURPOSE: A key into `packageJsonContract`'s `scripts` record — an npm script name. A caller
 * checking for a known script by a different branded string (e.g. a `CommandName`) re-parses its
 * string value through this contract to index the branded `Record` that field returns.
 *
 * USAGE:
 * scriptNameContract.parse('test');
 * // Returns a branded ScriptName
 */

import { z } from 'zod';

export const scriptNameContract = z.string().brand<'ScriptName'>();

export type ScriptName = z.infer<typeof scriptNameContract>;
