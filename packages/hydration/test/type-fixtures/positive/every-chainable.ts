/**
 * PURPOSE: Every chainable verb, compiling clean. Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s
 * "Every chainable, with an example" section, which is re-sourced FROM this file — this fixture
 * grows mechanisms a doc snippet cannot (extras, filter scope, the `Settable` narrowing) and is
 * graded by a real compiler run rather than merely read. Carries no deliberate error:
 * `collection-chain-transformer.test.ts` asserts it produces zero diagnostics.
 *
 * USAGE:
 * Nothing here runs — every export is a value the chain BUILDS, never executes.
 */
import { entryChainTransformer } from '../../../src/transformers/entry-chain/entry-chain-transformer';
import { fromSavedRefTransformer } from '../../../src/transformers/from-saved-ref/from-saved-ref-transformer';
import {
  guildIngredient,
  guildFieldsContract,
  questIngredient,
  questFieldsContract,
  questRecordContract,
  operationIngredient,
  sessionIngredient,
  nestedChainArgsContract,
} from '../dm-target';
import { SavedRecordNameStub } from '../../../src/contracts/saved-record-name/saved-record-name.stub';
import { FieldNameStub } from '../../../src/contracts/field-name/field-name.stub';

const dm = entryChainTransformer({
  registry: {
    guilds: guildIngredient,
    quests: questIngredient,
    operations: operationIngredient,
    sessions: sessionIngredient,
  },
});

export const everyChainable = dm.guilds.add(1, (g) => [
  // set — the ONE way to put a value on a row
  g[0].set({ name: guildFieldsContract.shape.name.parse('Siege') }),
  // saveRecordAs — the whole record, not only an id
  g[0].saveRecordAs({ name: 'guild' }),
  // a child accessor whose links this row's ancestry satisfies, and that ingredient's own extra
  g[0].sessions.add(1, (s) => [
    s[0].saveRecordAs({ name: 'origin' }),
    s[0].withNestedChain({ depth: nestedChainArgsContract.shape.depth.parse(2) }),
  ]),
  g[0].quests.add(2, (q, all) => [
    // all — add's second builder argument, broadcasting across every row this add just minted
    all.set({
      // fromSaved — a cross-link to a row the tree cannot reach directly
      userRequest: fromSavedRefTransformer({
        name: SavedRecordNameStub({ value: 'origin' }),
        field: FieldNameStub({ value: 'sessionId' }),
      }),
    }),
    // set, walking a transition field
    q[0].set({
      status: 'underway',
      title: questFieldsContract.shape.title.parse('The running one'),
    }),
    // setRaw — writes a field and walks nothing
    q[1].setRaw({ status: 'finished' }),
    // remove — deletes one row outright
    q[1].remove(),
  ]),
  // filter — selects rows that exist only at run time; expect defaults to 'some'
  g[0].quests.filter({ where: { status: 'queued' } }).remove(),
]);

// under — supplies a link from a recipe input rather than from an ancestor, and grows the ancestor
// chain by exactly that link: operations names BOTH quest (the immediate host) and guild (satisfied
// here by the id under() was given), so its accessor reaches the row under() minted
export const standaloneQuest = dm.quests
  .under({ guildId: questFieldsContract.shape.guildId.parse('guild-1') })
  .add(1, (q) => [q[0].operations.filter({ where: { role: 'ward' } }).remove()]);

// attach — brings an EXISTING row into scope by a `where` query, never a `write`: the row was not
// minted here, so `id` (a RECORD field, never one `FieldsOf<I>` carries) is what a caller matches
// on. `set`, `saveRecordAs` and the ingredient's own extras all work off the returned handle
// exactly as they do off a freshly `add`-ed row's.
export const attachedQuest = dm.quests.attach(
  { id: questRecordContract.shape.id.parse('00000000-0000-4000-8000-000000000001') },
  (q) => [
    q.set({ title: questFieldsContract.shape.title.parse('Reopened') }),
    q.saveRecordAs({ name: 'reattached' }),
  ],
);
