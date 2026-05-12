/**
 * PURPOSE: Defines a branded positive-integer cap on how many steps may be batched into a single codeweaver/lawbringer work item
 *
 * USAGE:
 * const cap: StepChunkSize = stepChunkSizeContract.parse(6);
 * // Returns a branded StepChunkSize number; min 1 (at least one step per chunk)
 */
import { z } from 'zod';

export const stepChunkSizeContract = z.number().int().min(1).brand<'StepChunkSize'>();

export type StepChunkSize = z.infer<typeof stepChunkSizeContract>;
