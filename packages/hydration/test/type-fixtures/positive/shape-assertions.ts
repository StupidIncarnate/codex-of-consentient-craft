/**
 * PURPOSE: The six compile-time SHAPE assertions plan `recipes-chunk-01-03-framework-types.md` §4
 * calls for — each is a real value typed `Expect<Equal<A, B>>`, so the TYPE stops existing the
 * moment the fact it names stops holding, and each is exported so a colocated jest test can also
 * assert the value at runtime. Every `Handle`/`Handles`/`Matched` fact here is read off a REAL chain
 * built through `entryChainTransformer`, never a hand-assembled `Registry` type: a plain object type
 * intersected with `Registry`'s own index signature widens `keyof R` back to plain `string`, which
 * silently empties every `ChildAccessors` key this file means to check. `sessionIngredient` stands
 * in for the `Matched`/`add` check specifically because it is the one ingredient here that DECLARES
 * an extra — for an ingredient with none, `ExtraMethods`'s fallback is a blanket index signature,
 * and `keyof` of that reports every string key (including `add`) as present, which is exactly the
 * `noUncheckedIndexedAccess` quirk `ingredient-declare-broker.test.ts`'s own comment describes.
 * `Matched<Quest>` would fail this specific check for that reason, not for the rule it names.
 *
 * A `let x!: boolean` capture is how a value built inside an `add` builder — which only the chain's
 * OWN generic inference can type correctly — reaches a top-level `export`: `add` invokes its builder
 * SYNCHRONOUSLY (see `collectionChainTransformer`), so the capture is assigned before this module's
 * next statement runs, and the `!` tells the compiler so.
 *
 * USAGE:
 * Nothing here runs any hydration route — every export is a value the chain BUILDS, or a bare type
 * fact, never something a runner executes.
 */
import { entryChainTransformer } from '../../../src/transformers/entry-chain/entry-chain-transformer';
import { guildIngredient, questIngredient, sessionIngredient, sessionFieldsContract } from '../dm-target';
import { userIngredient, postIngredient, commentIngredient } from '../sql-target';
import type { Settable } from '../../../src/contracts/ingredient-handle/ingredient-handle-contract';
import type { Equal, Expect } from '../expect';

const dm = entryChainTransformer({
  registry: { guilds: guildIngredient, quests: questIngredient, sessions: sessionIngredient },
});
const blog = entryChainTransformer({
  registry: { users: userIngredient, posts: postIngredient, comments: commentIngredient },
});

// 1a. A literal `n` keeps `add`'s handle list a fixed-length tuple.
export let fixedLengthTupleHolds!: boolean;
dm.quests.add(3, (q) => {
  const holds: Expect<Equal<(typeof q)['length'], 3>> = true;
  fixedLengthTupleHolds = holds;
  return [];
});

// 1b. The same `add`, given a widened `number`, degrades the tuple to a plain array.
const widenedCount: number = 3;
export let widenedTupleDegradesHolds!: boolean;
dm.quests.add(widenedCount, (q) => {
  const holds: Expect<Equal<(typeof q)['length'], number>> = true;
  widenedTupleDegradesHolds = holds;
  return [];
});

// 2. `Matched` drops `add` — checked against `sessionIngredient` for the reason this file's own
// PURPOSE comment names.
const filteredSessions = dm.sessions.filter({
  where: { transcript: sessionFieldsContract.shape.transcript.parse('x') },
});
export const matchedHasNoAddHolds: Expect<Equal<Extract<keyof typeof filteredSessions, 'add'>, never>> =
  true;

// 3. The IMMEDIATE-PARENT condition: `sessions` links only to `guild`, so it never appears on a
// quest handle — `quest` is never named in `sessions`'s own `links`, whatever the ancestor chain.
export let noSessionsOnQuestHolds!: boolean;
dm.quests.add(1, (q) => {
  const holds: Expect<Equal<Extract<keyof (typeof q)[0], 'sessions'>, never>> = true;
  noSessionsOnQuestHolds = holds;
  return [];
});

// 4. The ALL-LINKS-SATISFIED condition: `comments` names `user` among its own links, but a bare,
// top-level user supplies no `post`, so `comments` never appears on its handle either.
export let noCommentsOnBareUserHolds!: boolean;
blog.users.add(1, (u) => {
  const holds: Expect<Equal<Extract<keyof (typeof u)[0], 'comments'>, never>> = true;
  noCommentsOnBareUserHolds = holds;
  return [];
});

// 5. `Settable` narrows a transition field to exactly the declared `to` union — no chain call
// needed, `Settable<I>` reads only the ingredient's own config.
export const transitionNarrowsToDeclaredStatusesHolds: Expect<
  Equal<
    NonNullable<Settable<typeof questIngredient>['status']>,
    'queued' | 'accepted' | 'underway' | 'finished'
  >
> = true;

// 6. An ingredient's own extra survives onto its handle.
export let withNestedChainSurvivesHolds!: boolean;
dm.sessions.add(1, (s) => {
  const holds: Expect<Equal<Extract<keyof (typeof s)[0], 'withNestedChain'>, 'withNestedChain'>> = true;
  withNestedChainSurvivesHolds = holds;
  return [];
});
