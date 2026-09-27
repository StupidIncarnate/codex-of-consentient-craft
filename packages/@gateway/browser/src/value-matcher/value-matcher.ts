/**
 * PURPOSE: The tolerant-addressing type every browser proxy's "Matching…" methods take, declared
 * once so every `fetch`/`indexedDB`/`localStorage` proxy shares it instead of each redeclaring its
 * own copy. An exact-match method keys on the caller's literal value (a URL, a storage key, a
 * database name); a "Matching…" method also accepts a PREDICATE, for a caller whose real value is
 * computed from something the test does not control (a resolved URL, a generated storage key).
 *
 * USAGE:
 * import type { ValueMatcher } from '../value-matcher/value-matcher';
 * const matchesQuestKey: ValueMatcher = (value) => String(value).startsWith('dungeonmaster:quest:');
 */
export type ValueMatcher = string | ((value: unknown) => boolean);
