/**
 * PURPOSE: Creates a Hono sub-app with tooling routes (smoketest run + state) delegating to responders
 *
 * USAGE:
 * const toolingApp = ToolingFlow();
 * app.route('', toolingApp);
 * // Registers GET /api/tooling/smoketest/state always, and POST /api/tooling/smoketest/run only
 * // when TOOLING_SMOKETEST_HTTP=1
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { ToolingSmoketestRunResponder } from '../../responders/tooling/smoketest-run/tooling-smoketest-run-responder';
import { ToolingSmoketestStateResponder } from '../../responders/tooling/smoketest-state/tooling-smoketest-state-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const ToolingFlow = (): Hono => {
  const app = new Hono();

  // Registered ONLY when TOOLING_SMOKETEST_HTTP=1, mirroring E2E_SIGNAL_BACK_HTTP's
  // registration-time gate in quest-flow.ts. The route spawns a REAL Claude subprocess against the
  // caller's own repo root (see tooling-smoketest-run-responder.ts), and it registering
  // unconditionally — reachable by anyone who can hit the port, on every `dungeonmaster start` —
  // was an independent live finding. Gating inside the handler would leave the route mounted and
  // reachable regardless of a bug in that inner check; gating the registration means an unset flag
  // leaves no route at all, so an unauthorized caller gets the framework's own 404.
  if (process.env.TOOLING_SMOKETEST_HTTP === '1') {
    app.post(apiRoutesStatics.tooling.smoketestRun, async (c) => {
      const body: unknown = await c.req.json().catch(() => ({}));
      const result = await ToolingSmoketestRunResponder({ body });
      return c.json(result.data as object, result.status as ContentfulStatusCode);
    });
  }

  app.get(apiRoutesStatics.tooling.smoketestState, (c) => {
    const result = ToolingSmoketestStateResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
