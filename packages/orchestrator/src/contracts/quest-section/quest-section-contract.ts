/**
 * PURPOSE: Defines the valid section names for filtering quest data in get-quest
 *
 * USAGE:
 * questSectionContract.parse('requirements');
 * // Returns branded 'requirements' as QuestSection
 */
import { z } from 'zod';

export const questSectionContract = z.enum([
  'requirements',
  'designDecisions',
  'contracts',
  'contexts',
  'observables',
  'steps',
  'toolingRequirements',
  'executionLog',
  'flows',
]);

export type QuestSection = z.infer<typeof questSectionContract>;
