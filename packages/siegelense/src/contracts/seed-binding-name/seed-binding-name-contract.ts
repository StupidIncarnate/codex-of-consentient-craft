/**
 * PURPOSE: The name a `seed` step's `as:` gives its own output, and the half before the dot in
 * every `{g.guildSlug}` a later step reads it back by (siegelense-tooling.md line 2801: "`as` names
 * a step's output; `{name.field}` reads it back"). Reach for this over `RecipeName`: that one names
 * WHICH recipe ran, this one names THIS run of it, so two `seed` steps naming the same recipe can
 * still be told apart by the batch that reads them.
 *
 * A bare identifier and nothing else — no dot, because the dot is the separator the placeholder
 * splits on, and a binding whose own name held one would make `{a.b.c}` ambiguous between two
 * readings with nothing to choose between them.
 *
 * USAGE:
 * seedBindingNameContract.parse('g');
 * // Returns a branded SeedBindingName
 */

import { z } from 'zod';

export const seedBindingNameContract = z
  .string()
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*$/u,
    'A seed binding name is a bare identifier — letters, digits and underscores, starting with a letter or underscore, and no dot. The dot is what separates the binding from the field in `{g.guildSlug}`',
  )
  .brand<'SeedBindingName'>();

export type SeedBindingName = z.infer<typeof seedBindingNameContract>;
