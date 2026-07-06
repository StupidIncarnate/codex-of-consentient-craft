/**
 * PURPOSE: Builds the HTTP response for a non-API GET request in single-port (published) mode.
 *   Serves a static file from the built @dungeonmaster/web bundle when the request targets an asset
 *   under /assets/; otherwise returns index.html so the SPA client router renders the route.
 *
 * USAGE:
 * const { body, contentType, status } = await webBundleResponseBroker({ pathname: '/codex/quest/x' });
 * // → index.html at 200 (SPA fallback). '/assets/index-abc.js' → that file at 200.
 */
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { webBundleDistPathAdapter } from '../../../adapters/web-bundle/dist-path/web-bundle-dist-path-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import {
  webBundleContentTypeTransformer,
  type WebBundleContentType,
} from '../../../transformers/web-bundle-content-type/web-bundle-content-type-transformer';

const INDEX_HTML_PATH = '/index.html';

export const webBundleResponseBroker = async ({
  pathname,
}: {
  pathname: string;
}): Promise<{
  body: FileContents;
  contentType: WebBundleContentType;
  status: typeof httpStatusStatics.success.ok | typeof httpStatusStatics.serverError.internal;
}> => {
  const distPath = webBundleDistPathAdapter();

  if (distPath === null) {
    return {
      body: fileContentsContract.parse(
        'Dungeonmaster web bundle not found. Build it with `npm run build` before starting the server.',
      ),
      contentType: 'text/plain; charset=utf-8',
      status: httpStatusStatics.serverError.internal,
    };
  }

  // Static build output lives under /assets/*; every other GET path is a client-router route and
  // must receive index.html (SPA fallback). A '..' segment can only come from a crafted URL — never
  // the built bundle — so it is treated as a route, never a read outside dist.
  const isAsset = pathname.startsWith('/assets/') && !pathname.includes('..');
  const relativePath = filePathContract.parse(isAsset ? pathname : INDEX_HTML_PATH);

  const filepath = filePathContract.parse(pathJoinAdapter({ paths: [distPath, relativePath] }));
  const body = await fsReadFileAdapter({ filepath });

  return {
    body,
    contentType: webBundleContentTypeTransformer({ filePath: relativePath }),
    status: httpStatusStatics.success.ok,
  };
};
