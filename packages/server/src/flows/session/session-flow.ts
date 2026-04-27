/**
 * PURPOSE: Creates a Hono sub-app with session routes that delegate to session responders
 *
 * USAGE:
 * const sessionApp = SessionFlow();
 * app.route('', sessionApp);
 * // Registers GET /api/guilds/:guildId/sessions
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { SessionListResponder } from '../../responders/session/list/session-list-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const SessionFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.sessions.list, async (c) => {
    const result = await SessionListResponder({
      params: { guildId: c.req.param('guildId') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
