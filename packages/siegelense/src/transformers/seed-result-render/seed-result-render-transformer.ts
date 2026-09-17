/**
 * PURPOSE: The READING a `seed` step hands back — the ids the recipe made, as JSON, so a session
 * reading `results --step N` sees what it can now address. Reach for this rather than rendering a
 * recipe result anywhere else: a step's reading is one `ContentText`, and this is the one place
 * that shape is decided.
 *
 * The map stays FLAT, with the dotted keys the recipe's own manifest declares its returns under —
 * `sessions.nested`, not `{ sessions: { nested } }`. The spec's worked example at
 * siegelense-tooling.md line 2676 draws the nested form, and expanding into it would mean the same
 * data living in two shapes: `recipeResultContract` is flat so the keys a recipe PRODUCED can be
 * compared against the names its manifest PROMISED as one string-set check, and
 * `stepInterpolateTransformer` resolves `{s.sessions.nested}` by looking up the dotted key
 * directly. Flat is what everything downstream already reads, so flat is what gets printed.
 *
 * USAGE:
 * seedResultRenderTransformer({ result: { guildSlug: 'siege-1', 'sessions.nested': '/x' } });
 * // Returns '{"guildSlug":"siege-1","sessions.nested":"/x"}' as a branded ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import type { RecipeResult } from '@dungeonmaster/siegelense-recipes/contracts';

export const seedResultRenderTransformer = ({ result }: { result: RecipeResult }): ContentText =>
  contentTextContract.parse(JSON.stringify(result));
