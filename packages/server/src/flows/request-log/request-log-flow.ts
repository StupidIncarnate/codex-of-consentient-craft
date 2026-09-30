/**
 * PURPOSE: Creates a Hono sub-app holding one catch-all middleware that times every request and
 * hands the finished response (and any error a handler threw) to ServerRequestLogResponder.
 * Hono runs routes in registration order, so this must be mounted BEFORE every route flow —
 * mounted after, a route that answers never calls `next()` and the request goes unlogged.
 *
 * USAGE:
 * app.route('', RequestLogFlow());
 * // then mount every route flow; each request writes one '[http] ...' line when DUNGEONMASTER_REQUEST_LOG=1
 */

import { Hono } from '#gateway/npm/hono';

import { ServerRequestLogResponder } from '../../responders/server/request-log/server-request-log-responder';

export const RequestLogFlow = (): Hono => {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const startedAt = Date.now();
    await next();
    await ServerRequestLogResponder({
      method: c.req.method,
      path: c.req.path,
      response: c.res,
      durationMs: Date.now() - startedAt,
      error: c.error,
    });
  });

  return app;
};
