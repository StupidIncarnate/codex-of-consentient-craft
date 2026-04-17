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
  designDecisionContract,
  errorMessageContract,
  flowContract,
  flowObservableContract,
  planningScopeClassificationContract,
  questContractEntryContract,
  questIdContract,
  stepFileReferenceContract,
} from '@dungeonmaster/shared/contracts';

const stepFilePathContract = stepFileReferenceContract.shape.path;

const pathseekerWorkUnitContract = z.object({
  role: z.literal('pathseeker'),
  questId: questIdContract,
  failureContext: z.string().min(1).brand<'FailureContext'>().optional(),
});

const codeweaverWorkUnitContract = z.object({
  role: z.literal('codeweaver'),
  step: dependencyStepContract,
  questId: questIdContract,
  relatedContracts: z.array(questContractEntryContract),
  relatedObservables: z.array(flowObservableContract),
  relatedDesignDecisions: z.array(designDecisionContract).default([]),
  relatedFlows: z.array(flowContract).default([]),
});

const spiritmenderWorkUnitContract = z.object({
  role: z.literal('spiritmender'),
  filePaths: z.array(stepFilePathContract),
  errors: z.array(errorMessageContract).optional(),
  verificationCommand: z.string().min(1).brand<'VerificationCommand'>().optional(),
  contextInstructions: z.string().min(1).brand<'ContextInstructions'>().optional(),
});

const siegemasterWorkUnitContract = z.object({
  role: z.literal('siegemaster'),
  questId: questIdContract,
  relatedDesignDecisions: z.array(designDecisionContract).default([]),
  flow: flowContract,
  devServerUrl: z.string().url().brand<'DevServerUrl'>().optional(),
});

const lawbringerWorkUnitContract = z.object({
  role: z.literal('lawbringer'),
  filePaths: z.array(stepFilePathContract),
});

const blightwardenWorkUnitContract = z.object({
  role: z.literal('blightwarden'),
  questId: questIdContract,
  scopeSize: planningScopeClassificationContract.shape.size.optional(),
  relatedDesignDecisions: z.array(designDecisionContract).default([]),
});

export const workUnitContract = z.discriminatedUnion('role', [
  pathseekerWorkUnitContract,
  codeweaverWorkUnitContract,
  spiritmenderWorkUnitContract,
  lawbringerWorkUnitContract,
  siegemasterWorkUnitContract,
  blightwardenWorkUnitContract,
]);

export type WorkUnit = z.infer<typeof workUnitContract>;
export type PathseekerWorkUnit = z.infer<typeof pathseekerWorkUnitContract>;
export type CodeweaverWorkUnit = z.infer<typeof codeweaverWorkUnitContract>;
export type SpiritmenderWorkUnit = z.infer<typeof spiritmenderWorkUnitContract>;
export type LawbringerWorkUnit = z.infer<typeof lawbringerWorkUnitContract>;
export type SiegemasterWorkUnit = z.infer<typeof siegemasterWorkUnitContract>;
export type BlightwardenWorkUnit = z.infer<typeof blightwardenWorkUnitContract>;
