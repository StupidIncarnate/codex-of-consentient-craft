/**
 * PURPOSE: Creates a Hono sub-app with the health check and health-status seed routes
 *
 * USAGE:
 * const healthApp = HealthFlow();
 * app.route('', healthApp);
 * // Registers GET /api/health and GET /api/health/status
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { HealthStatusResponder } from '../../responders/health/status/health-status-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const HealthFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.health.check, (c) =>
    c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );

  app.get(apiRoutesStatics.health.status, (c) => {
    const result = HealthStatusResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
