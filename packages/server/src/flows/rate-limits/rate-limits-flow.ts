/**
 * PURPOSE: Creates a Hono sub-app with the rate-limits route delegating to RateLimitsGetResponder
 *
 * USAGE:
 * const rateLimitsApp = RateLimitsFlow();
 * app.route('', rateLimitsApp);
 * // Registers GET /api/rate-limits
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { RateLimitsGetResponder } from '../../responders/rate-limits/get/rate-limits-get-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const RateLimitsFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.rateLimits.get, async (c) => {
    const result = await RateLimitsGetResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
