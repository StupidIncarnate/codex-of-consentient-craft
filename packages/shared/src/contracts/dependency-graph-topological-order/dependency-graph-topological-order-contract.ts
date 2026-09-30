/**
 * PURPOSE: Defines the data `dependencyGraphTopologicalOrderTransformer` returns
 *
 * USAGE:
 * dependencyGraphTopologicalOrderContract.parse(value);
 * // Returns validated DependencyGraphTopologicalOrder
 */
import { z } from '#gateway/npm/zod';
import { packageJsonContract } from '../package-json/package-json-contract';

export const dependencyGraphTopologicalOrderContract = z
  .object({
    order: z.array(packageJsonContract.shape.name.unwrap()).nullable(),
    cycle: z.array(packageJsonContract.shape.name.unwrap()).nullable(),
  })
  .brand<'DependencyGraphTopologicalOrder'>();

export type DependencyGraphTopologicalOrder = z.infer<
  typeof dependencyGraphTopologicalOrderContract
>;
