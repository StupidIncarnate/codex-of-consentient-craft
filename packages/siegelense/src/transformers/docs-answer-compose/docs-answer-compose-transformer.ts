/**
 * PURPOSE: Turns one `docs --for <scope>` request into the `DocsAnswer` it is served — the `about`
 * preamble, plus one document per scope. A null scope (the bare `docs` call, `--for` omitted)
 * composes NO scope documents, but DOES carry `about` — the bare-call overview form. A named scope
 * composes that one document and carries NO `about`: a role page is written to stand alone (the
 * reader is the prompt that sent them, then this one page), so the tool-level preamble above it
 * would only push the page's own rules further from the top. Reach for this over reading
 * `docsStatics` directly: the scope list for a named scope is iterated from the call statics rather
 * than from the manual's own keys, so a scope pinned in the closed set but missing prose fails
 * loudly at compose time instead of silently serving nothing for it.
 *
 * USAGE:
 * docsAnswerComposeTransformer({ scope: null });
 * // Returns the about overview alone — no scope documents
 *
 * docsAnswerComposeTransformer({ scope: docsScopeContract.parse('fixing') });
 * // Returns one document, with requested: 'fixing' and about: []
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
  // Filtered from the pinned list rather than built from `[scope]`, so the index into the manual
  // stays the raw literal a branded DocsScope cannot be used as. A null scope matches nothing —
  // the about-alone form — rather than every entry.
  const served = siegelenseCallStatics.docs.scopes.filter(
    (name) => scope !== null && name === scope,
  );

  return docsAnswerContract.parse({
    requested: scope,
    about: scope === null ? docsStatics.about : [],
    scopes: served.map((name) => ({
      scope: name,
      audience: docsStatics.scopes[name].audience,
      summary: docsStatics.scopes[name].summary,
      sections: docsStatics.scopes[name].sections,
    })),
  });
};
