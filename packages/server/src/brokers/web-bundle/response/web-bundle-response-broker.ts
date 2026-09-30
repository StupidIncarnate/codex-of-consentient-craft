/**
 * PURPOSE: Builds the HTTP response for a non-API GET request in single-port (published) mode.
 *   Serves a static file from the built @dungeonmaster/web bundle when the request targets an asset
 *   under /assets/ or one of webBundleRootStaticPathsStatics; otherwise returns index.html so the
 *   SPA client router renders the route.
 *
 * USAGE:
 * const { body, contentType, status } = await webBundleResponseBroker({ pathname: '/codex/quest/x' });
 * // → index.html at 200 (SPA fallback). '/assets/index-abc.js' → that file at 200.
 */
import { readFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { webBundleDistPathBroker } from '../dist-path/web-bundle-dist-path-broker';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { webBundleRootStaticPathsStatics } from '../../../statics/web-bundle-root-static-paths/web-bundle-root-static-paths-statics';
import {
  webBundleContentTypeTransformer,
  type WebBundleContentType,
} from '../../../transformers/web-bundle-content-type/web-bundle-content-type-transformer';
import { webBundlePackageResolveBroker } from '../../web-bundle-package/resolve/web-bundle-package-resolve-broker';

const INDEX_HTML_PATH = '/index.html';

export const webBundleResponseBroker = async ({
  pathname,
}: {
  pathname: string;
}): Promise<{
  body: string;
  contentType: WebBundleContentType;
  status: typeof httpStatusStatics.success.ok | typeof httpStatusStatics.serverError.internal;
}> => {
  const packageName = await webBundlePackageResolveBroker();
  const distPath = webBundleDistPathBroker({ packageName });

  if (distPath === null) {
    return {
      body: 'Dungeonmaster web bundle not found. Build it with `npm run build` before starting the server.',
      contentType: 'text/plain; charset=utf-8',
      status: httpStatusStatics.serverError.internal,
    };
  }

  // Static build output lives under /assets/*, plus the root files webBundleRootStaticPathsStatics
  // names; every other GET path is a client-router route and must receive index.html (SPA fallback).
  // A '..' segment can only come from a crafted URL — never the built bundle — so it is treated as a
  // route, never a read outside dist.
  const isRootStatic = webBundleRootStaticPathsStatics.paths.some((path) => path === pathname);
  const isStatic = (pathname.startsWith('/assets/') || isRootStatic) && !pathname.includes('..');
  const relativePath = (isStatic ? pathname : INDEX_HTML_PATH);

  const filepath = join(distPath, relativePath);
  const body = (await readFile(filepath));

  return {
    body,
    contentType: webBundleContentTypeTransformer({ filePath: relativePath }),
    status: httpStatusStatics.success.ok,
  };
};
