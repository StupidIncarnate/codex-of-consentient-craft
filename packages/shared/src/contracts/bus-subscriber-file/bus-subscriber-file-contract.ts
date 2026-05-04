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

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const busSubscriberFileContract = z.object({
  subscriberFile: absoluteFilePathContract,
  busExportName: contentTextContract,
});

export type BusSubscriberFile = z.infer<typeof busSubscriberFileContract>;
