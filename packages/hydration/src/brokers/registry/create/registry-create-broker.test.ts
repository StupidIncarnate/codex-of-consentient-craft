import { registryCreateBroker } from './registry-create-broker';
import { registryCreateBrokerProxy } from './registry-create-broker.proxy';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { LinkSpecStub } from '../../../contracts/link-spec/link-spec.stub';
import { RegistryDuplicateNameError } from '../../../errors/registry-duplicate-name/registry-duplicate-name-error';
import { RegistryDanglingLinkError } from '../../../errors/registry-dangling-link/registry-dangling-link-error';
import { typescriptProgramDiagnosticsAdapter } from '../../../adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter';
import { RepoRelativePathStub, LineCountStub } from '@dungeonmaster/shared/contracts';
import {
  guildIngredient,
  questIngredient,
  operationIngredient,
  sessionIngredient,
} from '../../../../test/type-fixtures/dm-target';
import type { HydrationOpStub } from '../../../contracts/hydration-op/hydration-op.stub';

type HydrationOp = ReturnType<typeof HydrationOpStub>;

// ONE ts.createProgram for the whole suite, computed at module scope — see the plan's §10b "Two
// measurements, and what they settle" and `ingredientDeclareBroker`'s own suite, which this mirrors.
const DANGLING_LINK = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/dangling-link.ts',
});
const registryFixtureDiagnostics = typescriptProgramDiagnosticsAdapter({ files: [DANGLING_LINK] });

describe('registryCreateBroker', () => {
  describe('a well-formed registry', () => {
    it('VALID: {guilds, quests, operations, sessions} => returns one collection per key', () => {
      registryCreateBrokerProxy();

      const dm = registryCreateBroker({
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      });

      expect(Object.keys(dm).sort()).toStrictEqual(['guilds', 'operations', 'quests', 'sessions']);
    });

    // The specification's own worked example: "operations — which links to both quest and guild —
    // appears on q[0] and NOT on g[0], because a guild alone cannot supply a questId." This is the
    // POSITIVE half — reachable on the immediate parent whose ancestry satisfies every link.
    it("VALID: {q[0].operations.filter({where: {role: 'riftcarver'}, expect: 'one'}).remove()} => builds the scoped filter op", () => {
      registryCreateBrokerProxy();

      const dm = registryCreateBroker({
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      });

      const built = dm.guilds.add(1, (g) => [
        g[0].quests.add(1, (q) => [
          q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),
        ]),
      ]) as unknown as HydrationOp[];

      expect(built).toStrictEqual([
        {
          op: 'create',
          ingredient: 'guild',
          ref: 'guild[0:0]',
          index: 0,
          ancestors: [],
          fields: {},
        },
        {
          op: 'create',
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:0]',
          index: 0,
          ancestors: ['guild[0:0]'],
          fields: { title: 'Quest 1' },
        },
        {
          op: 'filter',
          ingredient: 'operation',
          scope: 'guild[0:0]/quest[0:0]',
          where: { role: 'riftcarver' },
          expect: 'one',
          matchedRef: 'guild[0:0]/quest[0:0]/operation[match]',
          ops: [{ op: 'remove', ref: 'guild[0:0]/quest[0:0]/operation[match]' }],
        },
      ]);
    });

    // The NEGATIVE half of the same rule: a guild alone cannot supply a questId, so `operations`
    // is absent from a GUILD handle even though `quests` and `sessions` (each linking only to
    // `guild`) both appear. Dropping the all-links-satisfied condition is exactly what would put
    // `operations` here too — see `ChildAccessors`'s own mutation-tested comment.
    it('VALID: {g[0], a guild handle} => holds no operations accessor, asserted on the whole runtime key set', () => {
      registryCreateBrokerProxy();

      const dm = registryCreateBroker({
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      });

      let guildHandleKeys: readonly string[] = [];
      dm.guilds.add(1, (g) => {
        guildHandleKeys = Object.keys(g[0]).sort();
        return [];
      });

      expect(guildHandleKeys).toStrictEqual([
        'ingredient',
        'quests',
        'ref',
        'remove',
        'saveRecordAs',
        'sessions',
        'set',
        'setRaw',
      ]);
    });
  });

  describe('two ingredients sharing a name', () => {
    it('INVALID: {quests and tasks both named "quest"} => throws RegistryDuplicateNameError', () => {
      registryCreateBrokerProxy();

      expect(() =>
        registryCreateBroker({
          quests: IngredientConfigStub() as never,
          tasks: IngredientConfigStub() as never,
        }),
      ).toThrow(RegistryDuplicateNameError);
    });

    it('INVALID: {quests and tasks both named "quest"} => throws naming both registry keys', () => {
      registryCreateBrokerProxy();

      expect(() =>
        registryCreateBroker({
          quests: IngredientConfigStub() as never,
          tasks: IngredientConfigStub() as never,
        }),
      ).toThrow(/^registry keys "quests" and "tasks" both declare the ingredient name "quest"$/u);
    });
  });

  describe('a links.of naming an ingredient the registry does not hold', () => {
    it('INVALID: {an ingredient linking to "no-such-ingredient"} => throws RegistryDanglingLinkError', () => {
      registryCreateBrokerProxy();

      expect(() =>
        registryCreateBroker({
          quests: IngredientConfigStub({
            links: [LinkSpecStub({ of: 'no-such-ingredient', as: 'title' })],
          }) as never,
        }),
      ).toThrow(RegistryDanglingLinkError);
    });

    it('INVALID: {an ingredient linking to "no-such-ingredient"} => throws naming the link and the registered names', () => {
      registryCreateBrokerProxy();

      expect(() =>
        registryCreateBroker({
          quests: IngredientConfigStub({
            links: [LinkSpecStub({ of: 'no-such-ingredient', as: 'title' })],
          }) as never,
        }),
      ).toThrow(
        /^ingredient "quest" links to "no-such-ingredient", which this registry does not hold\. Registered ingredient names: quest$/u,
      );
    });
  });

  // D9's compile-time half — plan `recipes-chunk-01-03-framework-types.md` §4's table, and §7's D4
  // note: "The declaration fixture for it is written and waiting". `dangling-link.ts` now imports
  // the real `registryCreateBroker` and calls it; a real `tsc` run is the only thing that can prove
  // the phantom-property intersection refuses the call, since this is a missing-required-property
  // question, not an assignability question a type-level `Equal` helper could answer.
  describe('the malformed declaration that must not compile', () => {
    it('INVALID: {links.of names an ingredient the registry does not hold} => refuses to compile', () => {
      registryCreateBrokerProxy();
      const result = registryFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === DANGLING_LINK,
      );

      // The absolute import(...) path TypeScript prints to disambiguate `Ingredient` embeds this
      // checkout's own filesystem location, so it is matched with a wildcard rather than asserted
      // literally — everything else in the message is asserted exactly, anchored start to end.
      expect(result).toStrictEqual([
        {
          file: DANGLING_LINK,
          line: LineCountStub({ value: 29 }),
          code: 2345,
          message: expect.stringMatching(
            /^Argument of type '\{ orphans: import\(".*"\)\.Ingredient<\{ readonly name: "orphan"; readonly description: "a row linking to an ingredient no registry will ever hold"; readonly fields: [^']*?\.\.\.' is not assignable to parameter of type '\{ orphans: import\(".*"\)\.Ingredient<\{ readonly name: "orphan"; readonly description: "a row linking to an ingredient no registry will ever hold"; readonly fields: [^']*?\.\.\.'\. {3}Property 'LINK_NAMES_AN_UNREGISTERED_INGREDIENT' is missing in type '\{ orphans: Ingredient<\{ readonly name: "orphan"; readonly description: "a row linking to an ingredient no registry will ever hold"; readonly fields: ZodType<\{ status: "queued" \| "accepted" \| "underway" \| "stalled" \| "finished"; title: string & BRAND<\.\.\.>; \}, ZodTypeDef, \{ \.\.\.; \}>; readonly record: ZodObject<\.\.\.>; re\.\.\.' but required in type '\{ LINK_NAMES_AN_UNREGISTERED_INGREDIENT: "no-such-ingredient"; \}'\.$/u,
          ),
        },
      ]);
    });
  });
});
