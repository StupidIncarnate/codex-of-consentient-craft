/**
 * PURPOSE: Extracts HTTP route registrations from a Hono flow file source text using regex.
 * Returns each call site's method, raw URL argument, and the responder identifier referenced
 * inside its handler body (when one exists — null for inline-handler routes like `/api/health`).
 *
 * USAGE:
 * const routes = serverRouteCallsExtractTransformer({
 *   source: contentTextContract.parse(`
 *     app.get(apiRoutesStatics.quests.list, async (c) => {
 *       const result = await QuestListResponder({ query });
 *       return c.json(result.data);
 *     });
 *   `),
 * });
 * // Returns [{ method: 'GET', rawArg: 'apiRoutesStatics.quests.list', responderName: 'QuestListResponder' }]
 *
 * WHEN-TO-USE: HTTP-edges broker extracting (route, responder) pairs from server flow files
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

// Matches the first `await <Identifier>Responder(` reference inside a handler body. The
// extractor scans the source slice between this app.<method>( call and the next one (or EOF).
const RESPONDER_REF_PATTERN = /\bawait\s+([A-Z][A-Za-z0-9]*Responder)\s*\(/u;

export const serverRouteCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ServerRouteCallSite[] => {
  const sourceStr = String(source);
  const callStarts = [];

  ROUTE_PATTERN.lastIndex = 0;
  let match = ROUTE_PATTERN.exec(sourceStr);
  while (match !== null) {
    const [whole, methodRaw, fullArg, singleQuoted, doubleQuoted] = match;
    if (methodRaw !== undefined && fullArg !== undefined) {
      const rawArg = singleQuoted ?? doubleQuoted ?? fullArg;
      callStarts.push({
        method: methodRaw.toUpperCase(),
        rawArg,
        bodyStart: match.index + whole.length,
      });
    }
    match = ROUTE_PATTERN.exec(sourceStr);
  }

  const results: ServerRouteCallSite[] = [];
  for (let i = 0; i < callStarts.length; i += 1) {
    const current = callStarts[i];
    if (current === undefined) continue;
    const next = callStarts[i + 1];
    const sliceEnd = next === undefined ? sourceStr.length : next.bodyStart;
    const sliceText = sourceStr.slice(current.bodyStart, sliceEnd);
    const responderMatch = RESPONDER_REF_PATTERN.exec(sliceText);
    const responderName =
      responderMatch?.[1] === undefined ? null : contentTextContract.parse(responderMatch[1]);
    results.push({
      method: contentTextContract.parse(current.method),
      rawArg: contentTextContract.parse(current.rawArg),
      responderName,
    });
  }

  return results;
};
