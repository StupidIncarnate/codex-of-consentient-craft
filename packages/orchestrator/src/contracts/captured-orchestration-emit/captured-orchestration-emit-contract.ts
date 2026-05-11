/**
 * PURPOSE: Shape of a captured orchestrationEventsState.emit call as recorded by test proxies — pairs the
 * emit's processId with its untyped payload Record so test setups can assert on both without redefining
 * the shape per proxy.
 *
 * USAGE:
 * import { capturedOrchestrationEmitContract } from '.../captured-orchestration-emit-contract';
 * import type { CapturedOrchestrationEmit } from '.../captured-orchestration-emit-contract';
 *
 * const captured: CapturedOrchestrationEmit[] = [];
 * orchestrationEventsState.on({ type: 'chat-output', handler: ({ processId, payload }) => {
 *   captured.push(capturedOrchestrationEmitContract.parse({ processId, payload }));
 * }});
 */

import { z } from 'zod';
import { processIdContract } from '@dungeonmaster/shared/contracts';

export const capturedOrchestrationEmitContract = z.object({
  processId: processIdContract,
  payload: z.record(z.unknown()),
});

export type CapturedOrchestrationEmit = z.infer<typeof capturedOrchestrationEmitContract>;
