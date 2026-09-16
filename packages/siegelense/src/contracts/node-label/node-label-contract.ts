/**
 * PURPOSE: The optional `node:` label a step carries, echoed onto its shot and its reading
 * (siegelense-tooling.md line 2821) so a session scanning a run's output can tell steps apart by
 * name instead of by index. Reach for this over Selector: a Selector is resolved against the live
 * page and can be ambiguous or match nothing, while a NodeLabel is never matched against anything —
 * it is the caller's own name for the step, carried through untouched.
 *
 * USAGE:
 * nodeLabelContract.parse('open-guild-modal');
 * // Returns a branded NodeLabel
 */

import { z } from 'zod';

export const nodeLabelContract = z.string().min(1).brand<'NodeLabel'>();

export type NodeLabel = z.infer<typeof nodeLabelContract>;
