/**
 * PURPOSE: Defines a branded string type for callback keys in debug responses
 *
 * USAGE:
 * const key: CallbackKey = callbackKeyContract.parse('onClick');
 * // Returns validated CallbackKey branded string
 */

import { z } from 'zod';

export const callbackKeyContract = z.string().min(1).brand<'CallbackKey'>();

export type CallbackKey = z.infer<typeof callbackKeyContract>;
