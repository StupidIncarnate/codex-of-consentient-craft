/**
 * PURPOSE: Defines discriminated union types for agent work units by role
 *
 * USAGE:
 * const workUnit = workUnitContract.parse({ role: 'pathseeker', questId: 'add-auth' });
 * // Returns validated work unit for routing to correct agent
 */

import { z } from 'zod';
import {
  dependencyStepContract,
  questIdContract,
  stepIdContract,
} from '@dungeonmaster/shared/contracts';

import { filePairWorkUnitContract } from '../file-pair-work-unit/file-pair-work-unit-contract';
import { fileWorkUnitContract } from '../file-work-unit/file-work-unit-contract';

const pathseekerWorkUnitContract = z.object({
  role: z.literal('pathseeker'),
  questId: questIdContract,
});

const codeweaverWorkUnitContract = z.object({
  role: z.literal('codeweaver'),
  step: dependencyStepContract,
});

const spiritmenderWorkUnitContract = z.object({
  role: z.literal('spiritmender'),
  file: fileWorkUnitContract,
  stepId: stepIdContract,
});

const lawbringerWorkUnitContract = z.object({
  role: z.literal('lawbringer'),
  filePair: filePairWorkUnitContract,
  stepId: stepIdContract,
});

const siegemasterWorkUnitContract = z.object({
  role: z.literal('siegemaster'),
  questId: questIdContract,
  stepId: stepIdContract,
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
