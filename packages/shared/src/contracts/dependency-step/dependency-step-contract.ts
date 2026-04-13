/**
 * PURPOSE: Defines the DependencyStep structure for mapping observables to single-file TDD steps with structured assertions
 *
 * USAGE:
 * dependencyStepContract.parse({id: 'create-user-api', name: 'Create API', assertions: [...], focusFile: {...}, accompanyingFiles: [], observablesSatisfied: [], dependsOn: [], inputContracts: ['Void'], outputContracts: ['User']});
 * // Returns: DependencyStep object
 *
 * A step must have exactly one of focusFile (file-owning step) or focusAction (verification or
 * process-invocation step with no single file target, typical for operational flow steps).
 */

import { z } from 'zod';

import { contractNameContract } from '../contract-name/contract-name-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { stepAssertionContract } from '../step-assertion/step-assertion-contract';
import { stepFileReferenceContract } from '../step-file-reference/step-file-reference-contract';
import { stepFocusActionContract } from '../step-focus-action/step-focus-action-contract';
import { stepIdContract } from '../step-id/step-id-contract';

export const dependencyStepContract = z.object({
  id: stepIdContract,
  name: z.string().min(1).brand<'StepName'>(),
  assertions: z.array(stepAssertionContract).min(1),
  observablesSatisfied: z.array(observableIdContract),
  dependsOn: z.array(stepIdContract),
  focusFile: stepFileReferenceContract
    .optional()
    .describe(
      'File path this step is responsible for creating or modifying. Use this OR focusAction, not both. Typical for runtime flow steps.',
    ),
  focusAction: stepFocusActionContract
    .optional()
    .describe(
      'Non-file action this step is responsible for (verification, command, sweep-check). Use this OR focusFile, not both. Typical for operational flow steps.',
    ),
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
