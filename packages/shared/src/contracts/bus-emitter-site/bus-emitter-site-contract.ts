/**
 * PURPOSE: Defines a single emit-site record — one source file containing one
 * `<busExportName>.emit({ type: '<eventType>' …` call. The boot-tree renderer
 * uses this to render `bus→ <eventType>` lines under the responder file.
 *
 * USAGE:
 * busEmitterSiteContract.parse({
 *   emitterFile: '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
 *   eventType: 'chat-output',
 *   busExportName: 'orchestrationEventsState',
 * });
 *
 * WHEN-TO-USE: Emitter-site discovery layer broker output and boot-tree renderer input.
 */

import { z } from '#gateway/npm/zod';

export const busEmitterSiteContract = z
  .object({
    emitterFile: z
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
      .brand<'BusEmitterSiteEmitterFile'>(),
    eventType: z.string().brand<'BusEmitterSiteEventType'>(),
    busExportName: z.string().brand<'BusEmitterSiteBusExportName'>(),
  })
  .brand<'BusEmitterSite'>();

export type BusEmitterSite = z.infer<typeof busEmitterSiteContract>;
