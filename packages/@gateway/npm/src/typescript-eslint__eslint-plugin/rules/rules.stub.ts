/**
 * PURPOSE: The package's own real `rules` object, imported directly (bypassing this subpath's own
 * barrel, which names its exports explicitly since the package ships an `export =`-style default)
 * — for a caller staging a real typescript-eslint rule module instead of hand-typing one.
 *
 * USAGE:
 * const rules = RulesStub();
 * // Returns the real rules object the plugin ships, keyed by real rule name
 */
import { rules } from '@typescript-eslint/eslint-plugin';

export const RulesStub = (): typeof rules => rules;
