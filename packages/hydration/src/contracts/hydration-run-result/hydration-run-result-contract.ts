/**
 * PURPOSE: What `run` hands back — flat, one key per `saveRecordAs`, and nothing else. Reach for
 * this over the registry accessors or the record map: a caller reading a plan's output sees only
 * what it explicitly named to save, never a row nobody saved and never the internal ref-keyed map
 * the walk used to get there.
 *
 * Typed as `Record<SavedRecordName, unknown>` until a scheduled pass threads each `saveRecordAs`
 * call's own record contract through the chain's return type — widening this to a typed shape is
 * additive and does not change what this contract accepts today.
 *
 * USAGE:
 * hydrationRunResultContract.parse({ guild: { id: 'g1' } });
 * // Returns HydrationRunResult
 */
import { z } from 'zod';
import { savedRecordNameContract } from '../saved-record-name/saved-record-name-contract';

export const hydrationRunResultContract = z.record(savedRecordNameContract, z.unknown());

export type HydrationRunResult = z.infer<typeof hydrationRunResultContract>;
