/**
 * PURPOSE: Defines the data `useOrchestrationModeBinding` returns
 *
 * USAGE:
 * useOrchestrationModeResultContract.parse(value);
 * // Returns validated UseOrchestrationModeResult
 */
import { z } from '#gateway/npm/zod';
import { orchestrationModeContract } from '@dungeonmaster/shared/contracts';

export const useOrchestrationModeResultContract = z
  .object({ mode: orchestrationModeContract.nullable(), isLoading: z.boolean() })
  .brand<'UseOrchestrationModeResult'>();

export type UseOrchestrationModeResult = z.infer<typeof useOrchestrationModeResultContract>;
