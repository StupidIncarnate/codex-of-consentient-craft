// B5, synthetic cross-check — a single-link ingredient (`c` links ONLY to `b`, its immediate
// parent, no double link) reached by skipping the immediate parent (`a[0].cs`, not `b[0].cs`).
// Checks whether the same "resolves to `undefined`" diagnostic shape `b5-fixture.ts` found against
// the real double-linked `subagent` also shows up for a plain single-link skip, or whether that
// shape is specific to a multi-link ingredient like `subagent`/`operation`.
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { aIngredient, bIngredient, cIngredient } from './deep-ingredients';

const dm = entryChainTransformer({ registry: { as: aIngredient, bs: bIngredient, cs: cIngredient } });

export const skipB = dm.as.add(1, (a) => [a[0].cs.add(1, () => [])]);
