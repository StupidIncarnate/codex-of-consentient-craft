/**
 * PURPOSE: Creates a Hono sub-app with the health check route
 *
 * USAGE:
 * const healthApp = HealthFlow();
 * app.route('', healthApp);
 * // Registers GET /api/health
 */

import { Hono } from 'hono';

import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const HealthFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.health.check, (c) =>
    c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );

  return app;
};
