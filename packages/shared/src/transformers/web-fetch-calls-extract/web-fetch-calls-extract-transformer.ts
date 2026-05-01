/**
 * PURPOSE: Extracts fetch adapter call sites from a web broker source text using regex.
 * Returns raw call sites with the HTTP method (derived from adapter name) and raw url
 * argument string (either a member-expression reference or a string literal).
 *
 * USAGE:
 * const calls = webFetchCallsExtractTransformer({
 *   source: contentTextContract.parse("fetchPostAdapter({ url: webConfigStatics.api.routes.questStart.replace(...), body: {} })"),
 * });
 * // Returns [{ method: 'POST', rawArg: 'webConfigStatics.api.routes.questStart' }]
 *
 * WHEN-TO-USE: HTTP-edges broker extracting fetch{Get,Post,Patch,Delete,Put}Adapter calls
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { WebFetchCallSite } from '../../contracts/web-fetch-call-site/web-fetch-call-site-contract';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';

const ADAPTER_ALTERNATION = Object.keys(projectMapStatics.webFetchAdapterMethods).join('|');

// Matches: fetchXxxAdapter({ url: webConfigStatics.api.routes.key }) or fetchXxxAdapter({ url: '/literal' })
// Handles optional TypeScript generic parameter between the adapter name and the opening paren.
// The statics ref pattern stops at a single key name (no further dots) to avoid capturing .replace(...).
// Capture groups: 1=adapterName  2=statics-ref  OR  3=single-quote  OR  4=double-quote
const FETCH_PATTERN = new RegExp(
  `\\b(${ADAPTER_ALTERNATION})(?:<[^>]*>)?\\s*\\(\\s*\\{[^}]*?url\\s*:\\s*(webConfigStatics\\.api\\.routes\\.[a-zA-Z0-9]+|'([^']*)'|"([^"]*)")`,
  'gu',
);

export const webFetchCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): WebFetchCallSite[] => {
  const results: WebFetchCallSite[] = [];
  FETCH_PATTERN.lastIndex = 0;

  let match = FETCH_PATTERN.exec(String(source));
  while (match !== null) {
    const [, adapterName, fullArg, singleQuoted, doubleQuoted] = match;
    if (adapterName === undefined || fullArg === undefined) {
      match = FETCH_PATTERN.exec(String(source));
      continue;
    }

    // When the arg is a quoted literal, use the unquoted content; otherwise use the whole statics ref
    const rawArgStr = singleQuoted ?? doubleQuoted ?? fullArg;
    const methodStr =
      projectMapStatics.webFetchAdapterMethods[
        adapterName as keyof typeof projectMapStatics.webFetchAdapterMethods
      ];

    results.push({
      method: contentTextContract.parse(methodStr),
      rawArg: contentTextContract.parse(rawArgStr),
    });

    match = FETCH_PATTERN.exec(String(source));
  }

  return results;
};
