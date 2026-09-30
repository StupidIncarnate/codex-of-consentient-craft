/**
 * PURPOSE: Defines the `data` a responder returns when it fails
 *
 * USAGE:
 * const data = responderErrorDataContract.parse({ error: 'Invalid params' });
 * // Returns { error } with a branded message
 */

import { z } from '#gateway/npm/zod';

export const responderErrorDataContract = z
  .strictObject({ error: z.string().brand<'ResponderErrorMessage'>() })
  .brand<'ResponderErrorData'>();

export type ResponderErrorData = z.infer<typeof responderErrorDataContract>;
