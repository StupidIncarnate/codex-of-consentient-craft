/**
 * PURPOSE: Creates a Hono sub-app with design sandbox routes that delegate to design responders
 *
 * USAGE:
 * const designApp = DesignFlow();
 * app.route('', designApp);
 * // Registers POST design start and stop endpoints
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { DesignStartResponder } from '../../responders/design/start/design-start-responder';
import { DesignStopResponder } from '../../responders/design/stop/design-stop-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const DesignFlow = (): Hono => {
  const app = new Hono();

  app.post(apiRoutesStatics.design.start, async (c) => {
    const result = await DesignStartResponder({
      params: { questId: c.req.param('questId') },
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.design.stop, (c) => {
    const result = DesignStopResponder({
      params: { questId: c.req.param('questId') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
