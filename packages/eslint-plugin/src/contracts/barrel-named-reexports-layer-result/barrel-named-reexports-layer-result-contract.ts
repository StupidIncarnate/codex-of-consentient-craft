/**
 * PURPOSE: Defines the data `barrelNamedReexportsLayerBroker` returns
 *
 * USAGE:
 * barrelNamedReexportsLayerResultContract.parse(value);
 * // Returns validated BarrelNamedReexportsLayerResult
 */
import { z } from '#gateway/npm/zod';

export const barrelNamedReexportsLayerResultContract = z.array(
  z
    .object({
      name: z.string().brand<'BarrelNamedReexportsLayerResultName'>(),
      source: z.string().brand<'BarrelNamedReexportsLayerResultSource'>(),
    })
    .brand<'BarrelNamedReexportsLayerResult'>(),
);

export type BarrelNamedReexportsLayerResult = z.infer<
  typeof barrelNamedReexportsLayerResultContract
>;
