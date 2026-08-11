/**
 * PURPOSE: Defines the valid section names for filtering quest data in get-quest
 *
 * USAGE:
 * questSectionContract.parse('designDecisions');
 * // Returns branded 'designDecisions' as QuestSection
 *
 * Lives in shared because both ends of a staged get-quest need it: the orchestrator filters a quest
 * down to a stage's sections, and the text renderer needs to know which sections were filtered out
 * so it can omit them rather than print them as "(none)".
 */
import { z } from 'zod';

export const questSectionContract = z.enum([
  'designDecisions',
  'contracts',
  'operations',
  'toolingRequirements',
  'packagesAffected',
  'workItems',
  'flows',
  'planningNotes',
]);

export type QuestSection = z.infer<typeof questSectionContract>;
