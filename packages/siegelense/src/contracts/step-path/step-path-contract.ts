/**
 * PURPOSE: The `path` a `goto` step carries — a `/`-rooted path, OR a value that BEGINS with a
 * `{binding.field}` placeholder a `seed` step earlier in the batch will resolve. Reach for this
 * over `urlPathContract` on a step: the spec's own worked batches write
 * `{ step: 'goto', path: '{s.sessions.nested}' }` (siegelense-tooling.md lines 2793 and 2922) —
 * a whole path that is nothing but a placeholder — and that value cannot start with a `/` at the
 * moment the batch is parsed, because the recipe that mints it has not run yet.
 *
 * It brands as `UrlPath` deliberately, so nothing downstream needs a second type: a step is parsed
 * TWICE, once as submitted and once after `stepInterpolateTransformer` substitutes, and by that
 * second parse the placeholder is gone — so the `/` rule is the only branch left and this contract
 * enforces it exactly where a real URL is about to be opened. A recipe returning a route without a
 * leading `/` therefore fails at the step, not at the browser.
 *
 * USAGE:
 * stepPathContract.parse('/{g.guildSlug}/quest/{g.questId}');
 * stepPathContract.parse('{s.sessions.nested}');
 * // Both return a branded UrlPath; '{s.sessions.nested}' would be rejected once substituted
 * // unless what it resolved to is itself `/`-rooted
 */

import { z } from 'zod';

import { seedPlaceholderStatics } from '../../statics/seed-placeholder/seed-placeholder-statics';

export const stepPathContract = z
  .string()
  .refine(
    (candidate) =>
      candidate.startsWith('/') ||
      new RegExp(`^${seedPlaceholderStatics.pattern.source}`, 'u').test(candidate),
    {
      message:
        'a goto path must start with "/" — or with a {binding.field} placeholder a `seed` step earlier in this batch resolves, which is how a whole route minted by a recipe is written',
    },
  )
  .brand<'UrlPath'>();

export type StepPath = z.infer<typeof stepPathContract>;
