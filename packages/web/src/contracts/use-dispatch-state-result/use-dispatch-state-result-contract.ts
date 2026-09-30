/**
 * PURPOSE: Defines the data `useDispatchStateBinding` returns
 *
 * USAGE:
 * useDispatchStateResultContract.parse(value);
 * // Returns validated UseDispatchStateResult
 */
import { z } from '#gateway/npm/zod';
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';

export const useDispatchStateResultContract = z
  .object({ state: dispatchStateContract.nullable(), isLoading: z.boolean() })
  .brand<'UseDispatchStateResult'>();

export type UseDispatchStateResult = z.infer<typeof useDispatchStateResultContract>;
