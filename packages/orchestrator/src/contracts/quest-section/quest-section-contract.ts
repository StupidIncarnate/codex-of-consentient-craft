/**
 * PURPOSE: Defines the valid section names for filtering quest data in get-quest
 *
 * USAGE:
 * questSectionContract.parse('designDecisions');
 * // Returns branded 'designDecisions' as QuestSection
 */
import { z } from 'zod';

export const questSectionContract = z.enum([
  'designDecisions',
  'contracts',
  'steps',
  'toolingRequirements',
  'executionLog',
  'flows',
]);

export type QuestSection = z.infer<typeof questSectionContract>;
