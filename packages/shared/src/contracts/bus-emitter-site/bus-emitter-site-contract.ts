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

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const busEmitterSiteContract = z.object({
  emitterFile: absoluteFilePathContract,
  eventType: contentTextContract,
  busExportName: contentTextContract,
});

export type BusEmitterSite = z.infer<typeof busEmitterSiteContract>;
