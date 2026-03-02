/**
 * PURPOSE: Creates a Hono sub-app with process routes that delegate to process responders
 *
 * USAGE:
 * const processApp = ProcessFlow();
 * app.route('', processApp);
 * // Registers GET /api/process/:processId and GET /api/process/:processId/output
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { ProcessStatusResponder } from '../../responders/process/status/process-status-responder';
import { ProcessOutputResponder } from '../../responders/process/output/process-output-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const ProcessFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.process.status, (c) => {
    const result = ProcessStatusResponder({ params: { processId: c.req.param('processId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  app.get(apiRoutesStatics.process.output, (c) => {
    const result = ProcessOutputResponder({ params: { processId: c.req.param('processId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
