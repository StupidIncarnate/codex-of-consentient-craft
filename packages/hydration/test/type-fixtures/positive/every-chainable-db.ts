/**
 * PURPOSE: Every chainable the DATABASE-backed ingredient set can exercise, compiling clean —
 * `every-chainable.ts`'s counterpart, proving the SAME chain composes over a foreign-key shape and
 * not only a file-backed one. `sql-target.ts`'s three ingredients declare no `extras`, so an
 * ingredient-specific extra has no counterpart here — the one chainable this file cannot exercise.
 * Adding one would mean editing the shared ingredient set every declaration and call-site fixture's
 * pinned diagnostics already depend on. Carries no deliberate error:
 * `typescript-program-diagnostics-adapter.test.ts` asserts it produces zero diagnostics.
 *
 * USAGE:
 * Nothing here runs — every export is a value the chain BUILDS, never executes.
 */
import { entryChainTransformer } from '../../../src/transformers/entry-chain/entry-chain-transformer';
import { fromSavedRefTransformer } from '../../../src/transformers/from-saved-ref/from-saved-ref-transformer';
import {
  userIngredient,
  userFieldsContract,
  postIngredient,
  postFieldsContract,
  commentIngredient,
} from '../sql-target';
import { SavedRecordNameStub } from '../../../src/contracts/saved-record-name/saved-record-name.stub';
import { FieldNameStub } from '../../../src/contracts/field-name/field-name.stub';

const blog = entryChainTransformer({
  registry: {
    users: userIngredient,
    posts: postIngredient,
    comments: commentIngredient,
  },
});

export const everyChainableDb = blog.users.add(2, (u, all) => [
  // set — the ONE way to put a value on a row
  all.set({ displayName: userFieldsContract.shape.displayName.parse('Seeded') }),
  // saveRecordAs — the whole record, not only an id
  u[0].saveRecordAs({ name: 'author' }),
  u[0].posts.add(2, (p, everyPost) => [
    // all, one level down — broadcasts across every row THIS add just minted
    everyPost.set({ body: postFieldsContract.shape.body.parse('seeded body') }),
    // set, walking a transition field
    p[0].set({
      status: 'scheduled',
      title: postFieldsContract.shape.title.parse('The scheduled one'),
    }),
    // setRaw — writes a field and walks nothing
    p[1].setRaw({ status: 'published' }),
    // a grandchild whose ALL-LINKS-SATISFIED condition IS met: post (immediate parent) and user (an
    // ancestor) both appear in p[0]'s own chain
    p[0].comments.add(1, (c) => [c[0].saveRecordAs({ name: 'firstComment' })]),
    // remove — deletes one row outright
    p[1].remove(),
  ]),
  // fromSaved — a cross-link to a row the tree cannot reach: this post's authorId points at u[0]'s
  // saved id, not at its own ancestor u[1]
  u[1].posts.add(1, (p) => [
    p[0].set({
      authorId: fromSavedRefTransformer({
        name: SavedRecordNameStub({ value: 'author' }),
        field: FieldNameStub({ value: 'id' }),
      }),
    }),
  ]),
  // filter — selects rows that exist only at run time; expect defaults to 'some'
  u[0].posts.filter({ where: { status: 'draft' } }).remove(),
]);

// under — supplies a link from a recipe input rather than from an ancestor
export const standalonePost = blog.posts
  .under({ authorId: postFieldsContract.shape.authorId.parse('user-1') })
  .add(1, () => []);
