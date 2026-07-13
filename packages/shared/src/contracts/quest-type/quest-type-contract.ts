/**
 * PURPOSE: Defines the QuestType enum discriminating which pipeline a quest follows
 *
 * USAGE:
 * questTypeContract.parse('feature');
 * // Returns: 'feature' as QuestType
 *
 * 'feature' is the Dumpster Explorer feature-development pipeline (flows → observables →
 * ChaosWhisperer-authored codeweaver op items → the operations-relay chain). 'bug-hunt' is the
 * regression pipeline (PestEater writes a failing test first, fixes, then ward → lawbringer →
 * blightwarden → ward). The active type
 * selects the intake slash command, the Start-Quest work-item graph, and the role set —
 * see questTypeRegistryStatics.
 */

import { z } from 'zod';

export const questTypeContract = z.enum(['feature', 'bug-hunt']);

export type QuestType = z.infer<typeof questTypeContract>;
