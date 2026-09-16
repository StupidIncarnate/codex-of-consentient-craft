/**
 * PURPOSE: The one thing the framework knows about any repo's own target — whether a server is
 * reachable. Reach for this as the CONSTRAINT on `createHydration<TTarget>`; the target's own
 * shape belongs to the repo, and the framework names neither files nor SQL.
 *
 * `Url` is declared here rather than imported from `@dungeonmaster/shared/contracts` — that
 * package exports no `Url` brand, only `urlSlugContract` (a kebab-case slug, a different value).
 * A repo's `baseUrl` needs a real URL brand, so this file is its home until a second consumer
 * outside this package asks for one.
 *
 * USAGE:
 * hydrationTargetContract.parse({});
 * hydrationTargetContract.parse({ baseUrl: 'http://localhost:3737' });
 * // Returns HydrationTarget
 */
import { z } from 'zod';

const urlContract = z.string().url().brand<'Url'>();

export type Url = z.infer<typeof urlContract>;

export const hydrationTargetContract = z.object({
  baseUrl: urlContract.optional(),
});

export type HydrationTarget = z.infer<typeof hydrationTargetContract>;
