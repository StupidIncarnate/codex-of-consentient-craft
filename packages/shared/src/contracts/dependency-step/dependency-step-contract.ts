/**
 * PURPOSE: Defines the DependencyStep structure for mapping observables to single-file TDD steps with structured assertions
 *
 * USAGE:
 * dependencyStepContract.parse({id: 'create-user-api', name: 'Create API', assertions: [...], focusFile: {...}, accompanyingFiles: [], observablesSatisfied: [], dependsOn: [], inputContracts: ['Void'], outputContracts: ['User']});
 * // Returns: DependencyStep object
 */

import { z } from 'zod';

import { contractNameContract } from '../contract-name/contract-name-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { stepAssertionContract } from '../step-assertion/step-assertion-contract';
import { stepFileReferenceContract } from '../step-file-reference/step-file-reference-contract';
import { stepIdContract } from '../step-id/step-id-contract';

export const dependencyStepContract = z.object({
  id: stepIdContract,
  name: z.string().min(1).brand<'StepName'>(),
  assertions: z.array(stepAssertionContract).min(1),
  observablesSatisfied: z.array(observableIdContract),
  dependsOn: z.array(stepIdContract),
  focusFile: stepFileReferenceContract,
  accompanyingFiles: z.array(stepFileReferenceContract),
  exportName: z
    .string()
    .min(1)
    .brand<'ExportName'>()
    .optional()
    .describe(
      'The exact export name for this step (e.g., "questExecuteBroker", "loginCredentialsContract"). Forces AI to commit to naming before implementation',
    ),
  inputContracts: z
    .array(contractNameContract)
    .min(1)
    .describe(
      'Contract names this step consumes as inputs. References quest-level contracts by name. Use ["Void"] for functions with no parameters',
    ),
  outputContracts: z
    .array(contractNameContract)
    .min(1)
    .describe(
      'Contract names this step produces as outputs. References quest-level contracts by name. Use ["Void"] for steps with no typed output',
    ),
  uses: z
    .array(z.string().min(1).brand<'UsesReference'>())
    .default([])
    .describe(
      'References to exports from other steps that this step integrates with. Names integration points visible in the branch diff',
    ),
});

export type DependencyStep = z.infer<typeof dependencyStepContract>;
