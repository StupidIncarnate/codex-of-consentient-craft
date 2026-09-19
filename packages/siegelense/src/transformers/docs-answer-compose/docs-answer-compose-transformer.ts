/**
 * PURPOSE: Turns one `docs --for <scope>` request into the `DocsAnswer` it is served — the `about`
 * preamble every answer carries, plus one document per scope. A null scope composes all seven in
 * `siegelenseCallStatics.docs.scopes`' own order, which is the whole-surface form. Reach for this
 * over reading `docsStatics` directly: the scope list is iterated from the call statics rather than
 * from the manual's own keys, so a scope pinned in the closed set but missing prose fails loudly at
 * compose time instead of silently serving six of seven.
 *
 * USAGE:
 * docsAnswerComposeTransformer({ scope: null });
 * // Returns the whole surface — every scope, in the spec's order
 *
 * docsAnswerComposeTransformer({ scope: docsScopeContract.parse('fixing') });
 * // Returns one document, with requested: 'fixing'
 */

import {
  docsAnswerContract,
  type DocsAnswer,
} from '../../contracts/docs-answer/docs-answer-contract';
import type { DocsScope } from '../../contracts/docs-scope/docs-scope-contract';
import { docsStatics } from '../../statics/docs/docs-statics';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';

export const docsAnswerComposeTransformer = ({
  scope,
}: {
  scope: DocsScope | null;
}): DocsAnswer => {
  // Filtered from the pinned list rather than built from `[scope]`, so the served order is the
  // spec's order for one scope and for seven alike, and the index into the manual stays the raw
  // literal a branded DocsScope cannot be used as.
  const served = siegelenseCallStatics.docs.scopes.filter(
    (name) => scope === null || name === scope,
  );

  return docsAnswerContract.parse({
    requested: scope,
    about: docsStatics.about,
    scopes: served.map((name) => ({
      scope: name,
      audience: docsStatics.scopes[name].audience,
      summary: docsStatics.scopes[name].summary,
      sections: docsStatics.scopes[name].sections,
    })),
  });
};
