/**
 * PURPOSE: Which ward invocation a `role: ward` ledger item runs. `committed` grades what this
 * branch's commits added on top of origin's default branch (ward's `--committed` flag); `full`
 * grades the whole monorepo with no file scope at all.
 *
 * ONE CONTRACT RATHER THAN THE ENUM SPELLED IN FIVE PLACES. It is persisted on three quest.json
 * shapes (work item, operation item, ward result) and travels through two more (the MCP run-ward
 * input, the orchestrator's next step), so a rename made in four of the five is a quest that parses
 * on write and throws on read.
 *
 * IT ACCEPTS THE PRE-RENAME VALUE ON READ. Quests already on disk carry `wardMode: "changed"`, and
 * a bare enum would reject the whole quest file rather than one field — a live quest that can no
 * longer be loaded, for a word. The preprocess step maps that one legacy value forward and nothing
 * else; every writer emits `committed`, so the shim only ever fires on a file written before the
 * rename and can be deleted once none are left.
 *
 * USAGE:
 * wardModeContract.parse('committed');
 * // 'committed'
 * wardModeContract.parse('changed');
 * // 'committed' — a quest.json written before the flag was renamed
 */
import { z } from 'zod';

const LEGACY_COMMITTED = 'changed';

export const wardModeContract = z.preprocess(
  (value) => (value === LEGACY_COMMITTED ? 'committed' : value),
  z.enum(['committed', 'full']),
);

export type WardMode = z.infer<typeof wardModeContract>;
