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
  flowNodeIdContract,
  flowObservableContract,
  folderTypeContract,
  packageNameContract,
  planningScopeClassificationContract,
  questContractEntryContract,
  questIdContract,
  sliceNameContract,
  stepFileReferenceContract,
  stepIdContract,
} from '@dungeonmaster/shared/contracts';

const stepFilePathContract = stepFileReferenceContract.shape.path;

const smoketestOverrideField = {
  smoketestPromptOverride: z.string().min(1).brand<'PromptText'>().optional(),
};

const sliceContract = z.object({
  name: sliceNameContract,
  packages: z.array(packageNameContract),
  flowIds: z.array(flowNodeIdContract),
});

const pathseekerWorkUnitContract = z.object({
  role: z.literal('pathseeker'),
  questId: questIdContract,
  failureContext: z.string().min(1).brand<'FailureContext'>().optional(),
  slice: sliceContract.optional(),
  ...smoketestOverrideField,
});

const codeweaverWorkUnitContract = z.object({
  role: z.literal('codeweaver'),
  steps: z.array(dependencyStepContract).min(1),
  folderTypes: z.array(folderTypeContract).default([]),
  questId: questIdContract,
  relatedContracts: z.array(questContractEntryContract),
  relatedObservables: z.array(flowObservableContract),
  relatedDesignDecisions: z.array(designDecisionContract).default([]),
  relatedFlows: z.array(flowContract).default([]),
  ...smoketestOverrideField,
});

const spiritmenderWorkUnitContract = z.object({
  role: z.literal('spiritmender'),
  filePaths: z.array(stepFilePathContract),
  errors: z.array(errorMessageContract).optional(),
  verificationCommand: z.string().min(1).brand<'VerificationCommand'>().optional(),
  contextInstructions: z.string().min(1).brand<'ContextInstructions'>().optional(),
  ...smoketestOverrideField,
});

const siegemasterWorkUnitContract = z.object({
  role: z.literal('siegemaster'),
  questId: questIdContract,
  relatedDesignDecisions: z.array(designDecisionContract).default([]),
  flow: flowContract,
  devServerUrl: z.string().url().brand<'DevServerUrl'>().optional(),
  ...smoketestOverrideField,
});

const lawbringerStepBoundaryContract = z.object({
  stepId: stepIdContract,
  filePaths: z.array(stepFilePathContract),
});

const lawbringerWorkUnitContract = z.object({
  role: z.literal('lawbringer'),
  // 'per-steps' (feature quests): review the file pairs named by stepBoundaries.
  // 'whole-diff' (bug-hunt quests): no per-step refs — review the entire branch diff.
  reviewMode: z.enum(['per-steps', 'whole-diff']).default('per-steps'),
  filePaths: z.array(stepFilePathContract).default([]),
  folderTypes: z.array(folderTypeContract).default([]),
  stepBoundaries: z.array(lawbringerStepBoundaryContract).default([]),
  questId: questIdContract.optional(),
  ...smoketestOverrideField,
});

const blightwardenWorkUnitContract = z.object({
  role: z.literal('blightwarden'),
  questId: questIdContract,
  scopeSize: planningScopeClassificationContract.shape.size.optional(),
  relatedDesignDecisions: z.array(designDecisionContract).default([]),
  ...smoketestOverrideField,
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
