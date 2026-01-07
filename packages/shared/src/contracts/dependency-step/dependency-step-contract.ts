/**
 * PURPOSE: Defines the DependencyStep structure for mapping tasks to file operations
 *
 * USAGE:
 * dependencyStepContract.parse({id: 'step-123', name: 'Create API', description: '...', taskLinks: [], observablesSatisfied: [], dependsOn: [], filesToCreate: [], filesToModify: []});
 * // Returns: DependencyStep object
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { stepIdContract } from '../step-id/step-id-contract';
import { taskIdContract } from '../task-id/task-id-contract';

export const dependencyStepContract = z.object({
  id: stepIdContract,
  name: z.string().min(1).brand<'StepName'>(),
  description: z.string().brand<'StepDescription'>(),
  taskLinks: z.array(taskIdContract),
  observablesSatisfied: z.array(observableIdContract),
  dependsOn: z.array(stepIdContract),
  filesToCreate: z.array(z.string().brand<'FilePath'>()),
  filesToModify: z.array(z.string().brand<'FilePath'>()),
});

export type DependencyStep = z.infer<typeof dependencyStepContract>;
