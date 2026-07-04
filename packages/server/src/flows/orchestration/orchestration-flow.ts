/**
 * PURPOSE: Creates a Hono sub-app with the orchestration dispatch routes (Node dispatcher
 * play/pause/state) delegating to the orchestration responders
 *
 * USAGE:
 * const orchestrationApp = OrchestrationFlow();
 * app.route('', orchestrationApp);
 * // Registers GET /api/orchestration/dispatch, POST .../dispatch/play, POST .../dispatch/pause
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { OrchestrationDispatchGetResponder } from '../../responders/orchestration/dispatch-get/orchestration-dispatch-get-responder';
import { OrchestrationDispatchPauseResponder } from '../../responders/orchestration/dispatch-pause/orchestration-dispatch-pause-responder';
import { OrchestrationDispatchPlayResponder } from '../../responders/orchestration/dispatch-play/orchestration-dispatch-play-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const OrchestrationFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.orchestration.dispatch, async (c) => {
    const result = await OrchestrationDispatchGetResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.orchestration.dispatchPlay, async (c) => {
    const body: unknown = await c.req.json().catch(() => ({}));
    const result = await OrchestrationDispatchPlayResponder({ body });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.orchestration.dispatchPause, async (c) => {
    const result = await OrchestrationDispatchPauseResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
