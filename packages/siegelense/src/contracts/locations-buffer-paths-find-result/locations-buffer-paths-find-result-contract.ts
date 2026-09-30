/**
 * PURPOSE: Defines the data `locationsBufferPathsFindBroker` returns
 *
 * USAGE:
 * locationsBufferPathsFindResultContract.parse(value);
 * // Returns validated LocationsBufferPathsFindResult
 */
import { z } from '#gateway/npm/zod';

export const locationsBufferPathsFindResultContract = z
  .object({
    console: z.string().brand<'LocationsBufferPathsFindResultConsole'>(),
    network: z.string().brand<'LocationsBufferPathsFindResultNetwork'>(),
    websocket: z.string().brand<'LocationsBufferPathsFindResultWebsocket'>(),
  })
  .brand<'LocationsBufferPathsFindResult'>();

export type LocationsBufferPathsFindResult = z.infer<typeof locationsBufferPathsFindResultContract>;
