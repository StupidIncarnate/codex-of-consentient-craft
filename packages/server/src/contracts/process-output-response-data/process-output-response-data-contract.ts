/**
 * PURPOSE: Defines the `data` ProcessOutputResponder returns on success — always empty slots,
 * since pipeline output streams over WebSocket chat-output events instead
 *
 * USAGE:
 * const data = processOutputResponseDataContract.parse({ slots: {} });
 * // Returns validated ProcessOutputResponseData
 */

import { z } from '#gateway/npm/zod';

export const processOutputResponseDataContract = z
  .strictObject({
    slots: z.strictObject({}).brand<'ProcessOutputResponseDataSlots'>(),
  })
  .brand<'ProcessOutputResponseData'>();

export type ProcessOutputResponseData = z.infer<typeof processOutputResponseDataContract>;
