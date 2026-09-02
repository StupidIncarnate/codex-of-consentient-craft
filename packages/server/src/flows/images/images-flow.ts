/**
 * PURPOSE: Creates a Hono sub-app with the pasted-image serve route that delegates to the image
 * responder. Reach for this over DirectoryFlow's pattern only because the response body here is
 * raw bytes with a Content-Type header, not a JSON envelope — everything else about the shape
 * (one route, one responder call) mirrors it.
 *
 * USAGE:
 * const imagesApp = ImagesFlow();
 * app.route('', imagesApp);
 * // Registers GET /api/images
 */

import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { ImageServeResponder } from '../../responders/image/serve/image-serve-responder';
import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

export const ImagesFlow = (): Hono => {
  const app = new Hono();

  app.get(apiRoutesStatics.images.serve, async (c) => {
    const path = c.req.query(apiRoutesStatics.images.pathQueryParam);
    const result = await ImageServeResponder({ path });
    return c.body(
      result.bytes,
      result.status as ContentfulStatusCode,
      result.contentType === null ? {} : { 'Content-Type': result.contentType },
    );
  });

  return app;
};
