/**
 * PURPOSE: What `planRunsTransformer` answers about a plan's route requirement — either every
 * ingredient the plan creates declares a `write` route, or the name of the first one that does
 * not. Reach for this over a boolean or a list of routes: the honest line the listing prints is
 * one of exactly two shapes, `runs serverless` or the ingredient that blocks it — never a count,
 * and never a union of routes that merely appear somewhere in the plan.
 *
 * USAGE:
 * planRunsResultContract.parse({ serverless: true });
 * planRunsResultContract.parse({ serverless: false, needsServerFor: 'guild' });
 * // Returns PlanRunsResult
 */
import { z } from '#gateway/npm/zod';

export const planRunsResultContract = z.discriminatedUnion('serverless', [
  z.object({ serverless: z.literal(true) }).brand<'PlanRunsResult'>(),
  z.object({ serverless: z.literal(false), needsServerFor: z.string().min(1).regex( /^[A-Za-z][A-Za-z0-9-]*$/u, 'must start with a letter and hold only letters, digits and hyphens — the character set a RowRef segment can encode', ).brand<'PlanRunsResultNeedsServerFor'>() }).brand<'PlanRunsResult'>(),
]);

export type PlanRunsResult = z.infer<typeof planRunsResultContract>;
