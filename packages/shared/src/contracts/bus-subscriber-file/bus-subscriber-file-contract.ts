/**
 * PURPOSE: Defines a single subscriber-file record — one source file that subscribes
 * to an event-bus singleton, either by calling `<busExportName>.on(...)` directly or
 * by importing an adapter that does. The boot-tree renderer uses this to render a
 * `bus← <busExportName>` summary line under the responder.
 *
 * USAGE:
 * busSubscriberFileContract.parse({
 *   subscriberFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
 *   busExportName: 'orchestrationEventsState',
 * });
 *
 * WHEN-TO-USE: Subscriber-site discovery layer broker output and boot-tree renderer input.
 */

import { z } from '#gateway/npm/zod';

export const busSubscriberFileContract = z
  .object({
    subscriberFile: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'BusSubscriberFileSubscriberFile'>(),
    busExportName: z.string().brand<'BusSubscriberFileBusExportName'>(),
  })
  .brand<'BusSubscriberFile'>();

export type BusSubscriberFile = z.infer<typeof busSubscriberFileContract>;
