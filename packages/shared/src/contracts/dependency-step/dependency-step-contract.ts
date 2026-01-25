/**
 * PURPOSE: Defines the DependencyStep structure for mapping observables to file operations
 *
 * USAGE:
 * dependencyStepContract.parse({id: 'step-123', name: 'Create API', description: '...', observablesSatisfied: [], dependsOn: [], filesToCreate: [], filesToModify: [], status: 'pending'});
 * // Returns: DependencyStep object
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { stepIdContract } from '../step-id/step-id-contract';
import { stepStatusContract } from '../step-status/step-status-contract';

export const dependencyStepContract = z.object({
  id: stepIdContract,
  name: z.string().min(1).brand<'StepName'>(),
  description: z.string().brand<'StepDescription'>(),
  observablesSatisfied: z.array(observableIdContract),
  dependsOn: z.array(stepIdContract),
  filesToCreate: z.array(z.string().brand<'FilePath'>()),
  filesToModify: z.array(z.string().brand<'FilePath'>()),
  status: stepStatusContract,
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  currentSession: z
    .object({
      sessionId: z.string().brand<'SessionId'>(),
      agentRole: z.string().brand<'AgentRole'>(),
      startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
    })
    .optional(),
  blockingReason: z.string().brand<'BlockingReason'>().optional(),
  blockingType: z.enum(['needs_user_input', 'needs_role_followup']).optional(),
  errorMessage: z.string().brand<'ErrorMessage'>().optional(),
});

export type DependencyStep = z.infer<typeof dependencyStepContract>;
