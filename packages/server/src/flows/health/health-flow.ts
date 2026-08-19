/**
 * PURPOSE: Creates a Hono sub-app with the health check route
 *
 * USAGE:
 * const healthApp = HealthFlow();
 * app.route('', healthApp);
 * // Registers GET /api/health
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { HealthCheckResponder } from '../../responders/health/check/health-check-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const HealthFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.health.check, async (c) => {
    const result = await HealthCheckResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
