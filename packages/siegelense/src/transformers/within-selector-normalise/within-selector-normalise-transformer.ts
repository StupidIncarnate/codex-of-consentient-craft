/**
 * PURPOSE: Turns a `look`'s `within` into the CSS selector the page-side reader scopes by. The spec
 * writes the scope as a bare testId — `{ step: 'look', within: 'SUBAGENT_CHAIN_HEADER' }`
 * (siegelense-tooling.md line 2593) — while every other step in this package takes the explicit
 * `[data-testid="…"]` form, and the AMBIGUOUS error prints that form too. Both must work: a session
 * copying a `within` out of an ambiguity error and a session writing the spec's own shorthand are
 * the same session, and one of the two failing silently by matching an element TAG of that name is
 * exactly the wrong-selector-reads-as-missing-element failure the whole addressing design exists to
 * remove.
 *
 * A bare word — letters, digits, `_` and `-`, and no CSS metacharacter — is a testId and is expanded.
 * Anything carrying `[`, `.`, `#`, `:`, `>`, `,`, `*`, `(` or whitespace is already a selector and is
 * handed back untouched.
 *
 * USAGE:
 * withinSelectorNormaliseTransformer({ within: selectorContract.parse('SUBAGENT_CHAIN_HEADER') });
 * // Returns '[data-testid="SUBAGENT_CHAIN_HEADER"]'
 */

const BARE_TESTID_PATTERN = /^[A-Za-z0-9_-]+$/u;

export const withinSelectorNormaliseTransformer = ({ within }: { within: string }): string =>
  BARE_TESTID_PATTERN.test(within) ? `[data-testid="${within}"]` : within;
