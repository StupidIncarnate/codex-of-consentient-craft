/**
 * PURPOSE: Creates a Hono sub-app with tooling routes (smoketest run + state) delegating to responders
 *
 * USAGE:
 * const toolingApp = ToolingFlow();
 * app.route('', toolingApp);
 * // Registers POST /api/tooling/smoketest/run and GET /api/tooling/smoketest/state
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { ToolingSmoketestRunResponder } from '../../responders/tooling/smoketest-run/tooling-smoketest-run-responder';
import { ToolingSmoketestStateResponder } from '../../responders/tooling/smoketest-state/tooling-smoketest-state-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const ToolingFlow = (): Hono => {
  const app = new Hono();

  app.post(apiRoutesStatics.tooling.smoketestRun, async (c) => {
    const body: unknown = await c.req.json().catch(() => ({}));
    const result = await ToolingSmoketestRunResponder({ body });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.get(apiRoutesStatics.tooling.smoketestState, (c) => {
    const result = ToolingSmoketestStateResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
