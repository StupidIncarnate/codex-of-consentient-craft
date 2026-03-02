/**
 * PURPOSE: Creates a Hono sub-app with session routes that delegate to session responders
 *
 * USAGE:
 * const sessionApp = SessionFlow();
 * app.route('', sessionApp);
 * // Registers POST /api/sessions/new, GET /api/guilds/:guildId/sessions, POST chat and chat stop
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { SessionNewResponder } from '../../responders/session/new/session-new-responder';
import { SessionListResponder } from '../../responders/session/list/session-list-responder';
import { SessionChatResponder } from '../../responders/session/chat/session-chat-responder';
import { SessionChatStopResponder } from '../../responders/session/chat-stop/session-chat-stop-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const SessionFlow = (): Hono => {
  const app = new Hono();

  app.post(apiRoutesStatics.sessions.new, async (c) => {
    const result = await SessionNewResponder({
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.get(apiRoutesStatics.sessions.list, async (c) => {
    const result = await SessionListResponder({
      params: { guildId: c.req.param('guildId') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.sessions.chat, async (c) => {
    const result = await SessionChatResponder({
      params: { sessionId: c.req.param('sessionId') },
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.post(apiRoutesStatics.sessions.chatStop, (c) => {
    const result = SessionChatStopResponder({
      params: { chatProcessId: c.req.param('chatProcessId') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
