/**
 * PURPOSE: Extracts HTTP route registrations from a Hono flow file source text using regex.
 * Returns raw route call sites with method and raw argument string (either a member-expression
 * reference like `apiRoutesStatics.quests.list` or a string literal like `/api/health`).
 *
 * USAGE:
 * const routes = serverRouteCallsExtractTransformer({
 *   source: contentTextContract.parse("app.get(apiRoutesStatics.quests.list, async (c) => {});"),
 * });
 * // Returns [{ method: 'GET', rawArg: 'apiRoutesStatics.quests.list' }]
 *
 * WHEN-TO-USE: HTTP-edges broker extracting app.<method>(<arg>) registrations from server flow files
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { ServerRouteCallSite } from '../../contracts/server-route-call-site/server-route-call-site-contract';

// Matches: app.get(apiRoutesStatics.foo.bar, ...) or app.post('/api/path', ...)
// Capture groups: 1=http-method  2=statics-ref OR 3=single-quote OR 4=double-quote
const ROUTE_PATTERN =
  /app\.(get|post|patch|delete|put)\(\s*(apiRoutesStatics\.[a-zA-Z0-9_.]+|'([^']*)'|"([^"]*)")/gu;

export const serverRouteCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ServerRouteCallSite[] => {
  const results: ServerRouteCallSite[] = [];
  ROUTE_PATTERN.lastIndex = 0;

  let match = ROUTE_PATTERN.exec(String(source));
  while (match !== null) {
    const [, methodRaw, fullArg, singleQuoted, doubleQuoted] = match;
    if (methodRaw === undefined || fullArg === undefined) {
      match = ROUTE_PATTERN.exec(String(source));
      continue;
    }

    // When the arg is a quoted literal, use the unquoted content; otherwise use the whole ref
    const rawArg = singleQuoted ?? doubleQuoted ?? fullArg;

    results.push({
      method: contentTextContract.parse(methodRaw.toUpperCase()),
      rawArg: contentTextContract.parse(rawArg),
    });

    match = ROUTE_PATTERN.exec(String(source));
  }

  return results;
};
