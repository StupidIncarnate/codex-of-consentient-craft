/**
 * PURPOSE: One JSON request against a lane's own API, for the recipes that build state by calling
 * the real code path — `fidelity: production` means "the server does what it really does"
 * (siegelense-recipes.md line 433), and that is only true if the recipe goes through the same HTTP
 * route a browser would. Reach for this over `fetchGetAdapter` from `@dungeonmaster/shared`: that
 * one is GET-only, and a production recipe's whole job is the POSTs and PATCHes that WRITE.
 *
 * A non-2xx THROWS, carrying the method, the url, the status and the start of the response body. A
 * recipe that quietly carried on past a refused write would hand back ids for state that does not
 * exist, and the walk would then fail three steps later against a screen that never had the data —
 * exactly the failure a fixture is supposed to remove.
 *
 * USAGE:
 * await fetchJsonAdapter({
 *   url: 'http://dungeonmaster.localhost:34172/api/guilds',
 *   method: 'POST',
 *   body: { name: 'Siege Guild', path: '/tmp/dm-siege-x/siege-repo' },
 * });
 * // Returns the parsed JSON body, or throws naming method, url, status and body
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';

export const fetchJsonAdapter = async ({
  url,
  method,
  body,
}: {
  url: ContentText;
  method: ContentText;
  body?: unknown;
}): Promise<unknown> => {
  const response = await globalThis.fetch(url, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await response.text();
  const excerpt = text.slice(0, recipeHttpStatics.limits.errorBodyChars);

  if (!response.ok) {
    throw new Error(`${method} ${url} failed with status ${String(response.status)}: ${excerpt}`);
  }

  try {
    return JSON.parse(text);
  } catch (error: unknown) {
    throw new Error(
      `${method} ${url} answered ${String(response.status)} with a body that is not JSON: ${excerpt}`,
      { cause: error },
    );
  }
};
