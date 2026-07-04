/**
 * PURPOSE: Orchestration flow exposing the Node dispatcher — bootstrap wiring, the server-boot
 * normalization, plus the play/pause/get surface the HTTP server calls.
 *
 * USAGE:
 * OrchestrationDispatchFlow.bootstrap();
 * const effective = await OrchestrationDispatchFlow.normalizeBoot(); // HTTP server boot ONLY
 * const state = await OrchestrationDispatchFlow.get();
 * const response = await OrchestrationDispatchFlow.play({ force: false });
 * const paused = await OrchestrationDispatchFlow.pause();
 */

import type { AdapterResult, DispatchState } from '@dungeonmaster/shared/contracts';

import type { DispatchPlayResponse } from '../../contracts/dispatch-play-response/dispatch-play-response-contract';
import { OrchestrationDispatchBootstrapResponder } from '../../responders/orchestration-dispatch/bootstrap/orchestration-dispatch-bootstrap-responder';
import { OrchestrationDispatchGetResponder } from '../../responders/orchestration-dispatch/get/orchestration-dispatch-get-responder';
import { OrchestrationDispatchNormalizeBootResponder } from '../../responders/orchestration-dispatch/normalize-boot/orchestration-dispatch-normalize-boot-responder';
import { OrchestrationDispatchPauseResponder } from '../../responders/orchestration-dispatch/pause/orchestration-dispatch-pause-responder';
import { OrchestrationDispatchPlayResponder } from '../../responders/orchestration-dispatch/play/orchestration-dispatch-play-responder';

export const OrchestrationDispatchFlow = {
  bootstrap: (): AdapterResult => OrchestrationDispatchBootstrapResponder(),

  normalizeBoot: async (): Promise<DispatchState> => OrchestrationDispatchNormalizeBootResponder(),

  get: async (): Promise<DispatchState> => OrchestrationDispatchGetResponder(),

  play: async ({ force }: { force?: boolean }): Promise<DispatchPlayResponse> =>
    OrchestrationDispatchPlayResponder({ ...(force === undefined ? {} : { force }) }),

  pause: async (): Promise<DispatchState> => OrchestrationDispatchPauseResponder(),
};
