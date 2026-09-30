/**
 * PURPOSE: Every `as:` binding one BATCH has made so far — the store `stepInterpolateTransformer`
 * resolves `{g.guildSlug}` against. Reach for this over a single `RecipeResult`: one batch can
 * seed more than once (`seed` is a step, placeable anywhere and as often as the walk needs —
 * siegelense-tooling.md line 2908), so what a later step reads is a MAP of runs, keyed by the name
 * each one was given.
 *
 * Scoped to one batch on purpose. A binding names the ids THIS batch made, and a batch is the unit
 * `run` returns a status for; carrying one across runs would mean surviving a `reset`, and an
 * unresolvable binding failing loudly by name is a better answer than a stale id resolving quietly.
 *
 * USAGE:
 * seedBindingsContract.parse({ g: { guildSlug: 'siege-guild' } });
 * // Returns the bindings a later step interpolates from
 */

import { z } from '#gateway/npm/zod';

import { seedResultContract } from '../seed-result/seed-result-contract';

export const seedBindingsContract = z.record(
  z
    .string()
    .regex(
      /^[A-Za-z_][A-Za-z0-9_]*$/u,
      'A seed binding name is a bare identifier — letters, digits and underscores, starting with a letter or underscore, and no dot. The dot is what separates the binding from the field in `{g.guildSlug}`',
    )
    .brand<'SeedBindingsKey'>(),
  seedResultContract,
);

export type SeedBindings = z.infer<typeof seedBindingsContract>;
