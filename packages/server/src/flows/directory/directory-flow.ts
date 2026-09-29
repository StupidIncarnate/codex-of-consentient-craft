/**
 * PURPOSE: Creates a Hono sub-app with directory browse route that delegates to the directory responder
 *
 * USAGE:
 * const directoryApp = DirectoryFlow();
 * app.route('', directoryApp);
 * // Registers POST /api/directories/browse
 */

import { Hono } from '#gateway/npm/hono';
import type { ContentfulStatusCode } from '#gateway/npm/hono__utils__http-status';

import { DirectoryBrowseResponder } from '../../responders/directory/browse/directory-browse-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const DirectoryFlow = (): Hono => {
  const app = new Hono();

  app.post(apiRoutesStatics.directories.browse, async (c) => {
    const body: unknown = await c.req.json();
    const result = DirectoryBrowseResponder({ body });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  return app;
};
