/**
 * PURPOSE: Defines a branded string type for step dependency labels in the execution view
 *
 * USAGE:
 * dependencyLabelContract.parse('step-1');
 * // Returns: DependencyLabel branded string
 */

import { z } from 'zod';

export const dependencyLabelContract = z.string().min(1).brand<'DependencyLabel'>();

export type DependencyLabel = z.infer<typeof dependencyLabelContract>;
