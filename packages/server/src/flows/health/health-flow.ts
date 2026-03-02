/**
 * PURPOSE: Creates a Hono sub-app with health check and root redirect routes
 *
 * USAGE:
 * const healthApp = HealthFlow();
 * app.route('', healthApp);
 * // Registers GET /api/health and GET / (redirect to web SPA)
 */

import { Hono } from 'hono';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const HealthFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.health.check, (c) =>
    c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );

  const serverPort = Number(process.env.DUNGEONMASTER_PORT) || environmentStatics.defaultPort;
  const serverHost = environmentStatics.hostname;
  app.get('/', (c) => c.redirect(`http://${serverHost}:${serverPort + 1}`));

  return app;
};
