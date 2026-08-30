/**
 * PURPOSE: Defines the QuestType enum discriminating which pipeline a quest follows
 *
 * USAGE:
 * questTypeContract.parse('feature');
 * // Returns: 'feature' as QuestType
 *
 * 'feature' is the Dumpster Explorer feature-development pipeline (flows → observables → the
 * codeweaver op items DERIVED at Start → the operations-relay chain). 'bug-hunt' is the regression
 * pipeline, whose intake draws the repro as a flow and then runs that SAME relay. The active type
 * selects the intake slash command and the create-time seed role; everything after riftcarver is
 * shared — see questTypeRegistryStatics.
 */

import { z } from 'zod';

export const questTypeContract = z.enum(['feature', 'bug-hunt']);

export type QuestType = z.infer<typeof questTypeContract>;
