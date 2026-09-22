/**
 * PURPOSE: What `run` hands back — flat, one key per `saveRecordAs`, and nothing else. Reach for
 * this over the registry accessors or the record map: a caller reading a plan's output sees only
 * what it explicitly named to save, never a row nobody saved and never the internal ref-keyed map
 * the walk used to get there.
 *
 * Stays `Record<SavedRecordName, unknown>` at RUNTIME — zod has no per-call knowledge of which
 * ingredient a plan saved under which name, so this schema cannot validate a specific shape. The
 * COMPILE-TIME return type is threaded already: `SavedOf<Ops>` types `Plan`'s output to each
 * `saveRecordAs` call's own record contract, and `planRunBroker` casts this contract's loose parse
 * result to that typed `TOut` at its one call site.
 *
 * USAGE:
 * hydrationRunResultContract.parse({ guild: { id: 'g1' } });
 * // Returns HydrationRunResult
 */
import { z } from 'zod';
import { savedRecordNameContract } from '../saved-record-name/saved-record-name-contract';

export const hydrationRunResultContract = z.record(savedRecordNameContract, z.unknown());

export type HydrationRunResult = z.infer<typeof hydrationRunResultContract>;
