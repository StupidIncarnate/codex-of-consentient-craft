/**
 * PURPOSE: Wraps MSW http handler creator and HttpResponse utilities for use in responders
 *
 * USAGE:
 * const { http, HttpResponse } = mswHttpAdapter();
 * server.use(http.get('/api/test', () => HttpResponse.json({ ok: true })));
 */

import { http, HttpResponse } from 'msw';

export const mswHttpAdapter = (): {
  http: typeof http;
  HttpResponse: typeof HttpResponse;
} => ({
  http,
  HttpResponse,
});
