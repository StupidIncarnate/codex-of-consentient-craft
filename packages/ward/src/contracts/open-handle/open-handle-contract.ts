/**
 * PURPOSE: Defines one async resource jest found still open after a run finished
 *
 * USAGE:
 * openHandleContract.parse({name: 'Error', message: 'TCPSERVERWRAP', stack: 'at Server.listen...'});
 * // Returns: OpenHandle validated object
 */

import { z } from 'zod';

export const openHandleContract = z.object({
  name: z.string().brand<'OpenHandleName'>(),
  // Jest puts the libuv handle TYPE here — `TCPSERVERWRAP`, `Timeout`, `FSREQCALLBACK` — which is
  // the half that says WHAT leaked.
  message: z.string().brand<'OpenHandleMessage'>(),
  // The frames say WHERE it was opened, which is the only half that leads to a fix.
  stack: z.string().brand<'OpenHandleStack'>().default(''),
});

export type OpenHandle = z.infer<typeof openHandleContract>;
