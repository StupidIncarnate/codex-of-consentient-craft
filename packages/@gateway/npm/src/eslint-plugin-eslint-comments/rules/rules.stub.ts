/**
 * PURPOSE: The package's own real `rules` object. `eslint-plugin-eslint-comments` ships an
 * `export =`-style default only (see this repo's own `@types/eslint-plugin-eslint-comments`
 * declaration), so this imports the raw package directly rather than through the barrel — the
 * same "a wrapper imports the raw package it wraps" pattern every other subpath in this gateway
 * follows.
 *
 * USAGE:
 * const rules = RulesStub();
 * // Returns the real rules object the plugin ships, keyed by real rule name
 */
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';

export const RulesStub = (): Record<string, unknown> => eslintCommentsPlugin.rules;
