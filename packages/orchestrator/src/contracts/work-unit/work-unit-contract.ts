/**
 * PURPOSE: Defines discriminated union types for agent work units by role
 *
 * USAGE:
 * const workUnit = workUnitContract.parse({ role: 'pathseeker', questId: 'add-auth' });
 * // Returns validated work unit for routing to correct agent
 */

import { z } from 'zod';
import {
  absoluteFilePathContract,
  contextContract,
  dependencyStepContract,
  errorMessageContract,
  observableContract,
  questContractEntryContract,
  questIdContract,
  requirementContract,
} from '@dungeonmaster/shared/contracts';

const pathseekerWorkUnitContract = z.object({
  role: z.literal('pathseeker'),
  questId: questIdContract,
});

const codeweaverWorkUnitContract = z.object({
  role: z.literal('codeweaver'),
  step: dependencyStepContract,
  questId: questIdContract,
  relatedContracts: z.array(questContractEntryContract),
  relatedObservables: z.array(observableContract),
  relatedRequirements: z.array(requirementContract),
});

const spiritmenderWorkUnitContract = z.object({
  role: z.literal('spiritmender'),
  filePaths: z.array(absoluteFilePathContract),
  errors: z.array(errorMessageContract).optional(),
});

const siegemasterWorkUnitContract = z.object({
  role: z.literal('siegemaster'),
  questId: questIdContract,
  observables: z.array(observableContract),
  contexts: z.array(contextContract),
});

const lawbringerWorkUnitContract = z.object({
  role: z.literal('lawbringer'),
  filePaths: z.array(absoluteFilePathContract),
});

export const workUnitContract = z.discriminatedUnion('role', [
  pathseekerWorkUnitContract,
  codeweaverWorkUnitContract,
  spiritmenderWorkUnitContract,
  lawbringerWorkUnitContract,
  siegemasterWorkUnitContract,
]);

export type WorkUnit = z.infer<typeof workUnitContract>;
export type PathseekerWorkUnit = z.infer<typeof pathseekerWorkUnitContract>;
export type CodeweaverWorkUnit = z.infer<typeof codeweaverWorkUnitContract>;
export type SpiritmenderWorkUnit = z.infer<typeof spiritmenderWorkUnitContract>;
export type LawbringerWorkUnit = z.infer<typeof lawbringerWorkUnitContract>;
export type SiegemasterWorkUnit = z.infer<typeof siegemasterWorkUnitContract>;
