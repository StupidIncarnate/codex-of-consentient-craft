/**
 * PURPOSE: A CSS or testid selector string — the `target` and `within` a targeting step drives
 * against, and the durable handle for anything saved, re-run, briefed, or written into a record
 * (siegelense-tooling.md line 2049). Reach for this over a `ref`: a ref is ephemeral, minted by a
 * `look` against one page state in one session, and must never be stored (line 2044); a Selector
 * means the same element the next time anyone runs it, which is what makes it safe to save in a
 * batch, a recipe, or a guide.
 *
 * USAGE:
 * selectorContract.parse('[data-testid="GUILD_ADD"]');
 * // Returns a branded Selector
 */

import { z } from 'zod';

export const selectorContract = z.string().min(1).brand<'Selector'>();

export type Selector = z.infer<typeof selectorContract>;
