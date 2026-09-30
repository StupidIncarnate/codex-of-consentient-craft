import { registryCreateBroker } from './registry-create-broker';
import { registryCreateBrokerProxy } from './registry-create-broker.proxy';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { LinkSpecStub } from '../../../contracts/link-spec/link-spec.stub';
import { RegistryDuplicateNameError } from '../../../errors/registry-duplicate-name/registry-duplicate-name-error';
import { RegistryDanglingLinkError } from '../../../errors/registry-dangling-link/registry-dangling-link-error';
import { typescriptProgramDiagnostics } from '../../../../test/type-fixtures/typescript-program-diagnostics';
import {
  guildIngredient,
  questIngredient,
  operationIngredient,
  sessionIngredient,
} from '../../../../test/type-fixtures/dm-target';
import {
  fixedLengthTupleHolds,
  widenedTupleDegradesHolds,
  matchedHasNoAddHolds,
  noSessionsOnQuestHolds,
  noCommentsOnBareUserHolds,
  transitionNarrowsToDeclaredStatusesHolds,
  withNestedChainSurvivesHolds,
} from '../../../../test/type-fixtures/positive/shape-assertions';
import type { HydrationOpStub } from '../../../contracts/hydration-op/hydration-op.stub';

type HydrationOp = ReturnType<typeof HydrationOpStub>;

// ONE ts.createProgram for the whole suite, computed at module scope — see the plan's §10b "Two
// measurements, and what they settle" and `ingredientDeclareBroker`'s own suite, which this mirrors.
const CLEAN_FIXTURE = 'packages/hydration/test/adapter-fixtures/clean.ts';
const ONE_ERROR_FIXTURE = 'packages/hydration/test/adapter-fixtures/one-error.ts';
const DANGLING_LINK = 'packages/hydration/test/type-fixtures/declaration/dangling-link.ts';
const OUT_OF_BOUNDS = 'packages/hydration/test/type-fixtures/call-site/out-of-bounds.ts';
const UNKNOWN_FIELD = 'packages/hydration/test/type-fixtures/call-site/unknown-field.ts';
const UNREACHABLE_TRANSITION =
  'packages/hydration/test/type-fixtures/call-site/unreachable-transition.ts';
const NOT_A_STATUS = 'packages/hydration/test/type-fixtures/call-site/not-a-status.ts';
const REAL_QUEST_UNREACHABLE_STATUS =
  'packages/hydration/test/type-fixtures/call-site/real-quest-unreachable-status.ts';
const EXTRA_NOT_DECLARED = 'packages/hydration/test/type-fixtures/call-site/extra-not-declared.ts';
const EXTRA_ARG_TYPED = 'packages/hydration/test/type-fixtures/call-site/extra-arg-typed.ts';
const CHILD_WRONG_HOST = 'packages/hydration/test/type-fixtures/call-site/child-wrong-host.ts';
const CHILD_LINKS_UNSATISFIED =
  'packages/hydration/test/type-fixtures/call-site/child-links-unsatisfied.ts';
const UNDER_LINKS_UNSATISFIED =
  'packages/hydration/test/type-fixtures/call-site/under-links-unsatisfied.ts';
const FILTER_HAS_NO_INDEX =
  'packages/hydration/test/type-fixtures/call-site/filter-has-no-index.ts';
const FILTER_HAS_NO_ADD = 'packages/hydration/test/type-fixtures/call-site/filter-has-no-add.ts';
const BAD_EXPECT = 'packages/hydration/test/type-fixtures/call-site/bad-expect.ts';
const BAD_WHERE_FIELD = 'packages/hydration/test/type-fixtures/call-site/bad-where-field.ts';
const ATTACH_BAD_WHERE_FIELD =
  'packages/hydration/test/type-fixtures/call-site/attach-bad-where-field.ts';
const DB_UNREACHABLE_STATUS =
  'packages/hydration/test/type-fixtures/call-site/db-unreachable-status.ts';
const DB_UNKNOWN_COLUMN = 'packages/hydration/test/type-fixtures/call-site/db-unknown-column.ts';
const POSITIVE_EVERY_CHAINABLE =
  'packages/hydration/test/type-fixtures/positive/every-chainable.ts';
const POSITIVE_EVERY_CHAINABLE_DB =
  'packages/hydration/test/type-fixtures/positive/every-chainable-db.ts';
const POSITIVE_SHAPE_ASSERTIONS =
  'packages/hydration/test/type-fixtures/positive/shape-assertions.ts';

const suiteDiagnostics = typescriptProgramDiagnostics({
  files: [
    CLEAN_FIXTURE,
    ONE_ERROR_FIXTURE,
    DANGLING_LINK,
    OUT_OF_BOUNDS,
    UNKNOWN_FIELD,
    UNREACHABLE_TRANSITION,
    NOT_A_STATUS,
    REAL_QUEST_UNREACHABLE_STATUS,
    EXTRA_NOT_DECLARED,
    EXTRA_ARG_TYPED,
    CHILD_WRONG_HOST,
    CHILD_LINKS_UNSATISFIED,
    UNDER_LINKS_UNSATISFIED,
    FILTER_HAS_NO_INDEX,
    FILTER_HAS_NO_ADD,
    BAD_EXPECT,
    BAD_WHERE_FIELD,
    ATTACH_BAD_WHERE_FIELD,
    DB_UNREACHABLE_STATUS,
    DB_UNKNOWN_COLUMN,
    POSITIVE_EVERY_CHAINABLE,
    POSITIVE_EVERY_CHAINABLE_DB,
    POSITIVE_SHAPE_ASSERTIONS,
  ],
});

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
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === DANGLING_LINK);

      // The absolute import(...) path TypeScript prints to disambiguate `Ingredient` embeds this
      // checkout's own filesystem location, so it is matched with a wildcard rather than asserted
      // literally. TS's own `defaultMaximumTruncationLength` (160, a per-type character budget) then
      // spends that budget on the printed path itself, so a longer checkout path — this worktree's
      // `worktrees/<name>/` segment included — shifts WHERE the ellipsis lands inside the object
      // literal. So each of those two truncated types is matched only up to `Ingredient<{`, then
      // any text up to the ellipsis. The third, untruncated type and everything else in the
      // message are asserted exactly, anchored start to end.
      expect(result).toStrictEqual([
        {
          file: DANGLING_LINK,
          line: 29,
          code: 2345,
          message: expect.stringMatching(
            /^Argument of type '\{ orphans: import\(".*"\)\.Ingredient<\{ [^']*\.\.\.' is not assignable to parameter of type '\{ orphans: import\(".*"\)\.Ingredient<\{ [^']*\.\.\.'\. {3}Property 'LINK_NAMES_AN_UNREGISTERED_INGREDIENT' is missing in type '\{ orphans: Ingredient<\{ readonly name: "orphan"; readonly description: "a row linking to an ingredient no registry will ever hold"; readonly fields: ZodType<\{ title: string & \$brand<"SampleTitle">; status: "queued" \| \.\.\. 3 more \.\.\. \| "finished"; \}, \{ \.\.\.; \}, \$ZodTypeInternals<\.\.\.>>; readonly record: ZodObject<\.\.\.>; \.\.\.' but required in type '\{ LINK_NAMES_AN_UNREGISTERED_INGREDIENT: "no-such-ingredient"; \}'\.$/u,
          ),
        },
      ]);
    });
  });

  describe('typescriptProgramDiagnostics', () => {
    describe('a program with no errors', () => {
      it('VALID: {files: [clean fixture]} => returns no diagnostics', () => {
        registryCreateBrokerProxy();

        const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === CLEAN_FIXTURE);

        expect(result).toStrictEqual([]);
      });
    });

    describe('a program with one deliberate error', () => {
      it('VALID: {files: [fixture with one error]} => returns that diagnostic', () => {
        registryCreateBrokerProxy();

        const result = suiteDiagnostics.filter(
          (diagnostic) => diagnostic.file === ONE_ERROR_FIXTURE,
        );

        expect(result).toStrictEqual([
          {
            file: ONE_ERROR_FIXTURE,
            line: 1,
            code: 2322,
            message: "Type 'number' is not assignable to type 'string'.",
          },
        ]);
      });
    });
  });

  describe('the malformed call sites that must not compile', () => {
    it('INVALID: {q[3] after add(3, …)} => refuses to compile', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === OUT_OF_BOUNDS);

      expect(result).toStrictEqual([
        {
          file: OUT_OF_BOUNDS,
          line: 10,
          code: 2493,
          message:
            'Tuple type \'[Handle<{ guilds: Ingredient<{ readonly name: "guild"; readonly description: "a guild the server has registered, with its id and url slug minted"; readonly fields: ZodType<{ name: string & $brand<"GuildName">; path: string & $brand<...>; }, { ...; }, $ZodTypeInternals<...>>; readonly record: ZodObject<...>; readonly...\' of length \'3\' has no element at index \'3\'.',
        },
      ]);
    });

    it("INVALID: {set({nope: 1})} => refuses to compile, naming 'nope'", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === UNKNOWN_FIELD);

      expect(result).toStrictEqual([
        {
          file: UNKNOWN_FIELD,
          line: 8,
          code: 2353,
          message:
            'Object literal may only specify known properties, and \'nope\' does not exist in type \'FieldValuesFor<{ name: string & $brand<"GuildName">; path: string & $brand<"GuildFieldsPath">; }>\'.',
        },
      ]);
    });

    it("INVALID: {set({status: 'stalled'})} => refuses to compile, 'stalled' is not in transitions.to", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === UNREACHABLE_TRANSITION,
      );

      expect(result).toStrictEqual([
        {
          file: UNREACHABLE_TRANSITION,
          line: 11,
          code: 2322,
          message:
            'Type \'"stalled"\' is not assignable to type \'"queued" | "accepted" | "underway" | "finished"\'.',
        },
      ]);
    });

    it('INVALID: {set({status: "nonsense"})} => refuses to compile, not a status at all', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === NOT_A_STATUS);

      expect(result).toStrictEqual([
        {
          file: NOT_A_STATUS,
          line: 9,
          code: 2322,
          message:
            'Type \'"nonsense"\' is not assignable to type \'"queued" | "accepted" | "underway" | "finished"\'.',
        },
      ]);
    });

    it("INVALID: {the REAL quest ingredient's set({status: 'blocked'})} => refuses to compile", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === REAL_QUEST_UNREACHABLE_STATUS,
      );

      expect(result).toStrictEqual([
        {
          file: REAL_QUEST_UNREACHABLE_STATUS,
          line: 15,
          code: 2322,
          message:
            'Type \'"blocked"\' is not assignable to type \'"explore_flows" | "review_flows" | "flows_approved" | "explore_observables" | "review_observables" | "approved" | "in_progress" | "complete" | "abandoned"\'.',
        },
      ]);
    });

    it('INVALID: {q[0].withNestedChain(...)} => refuses to compile, quest declares no such extra', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === EXTRA_NOT_DECLARED,
      );

      expect(result).toStrictEqual([
        {
          file: EXTRA_NOT_DECLARED,
          line: 10,
          code: 2722,
          message: "Cannot invoke an object which is possibly 'undefined'.",
        },
      ]);
    });

    it("INVALID: {withNestedChain({depth: 'two'})} => refuses to compile, depth is a number", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === EXTRA_ARG_TYPED);

      expect(result).toStrictEqual([
        {
          file: EXTRA_ARG_TYPED,
          line: 10,
          code: 2322,
          message:
            "Type 'string' is not assignable to type 'number & $brand<\"ChainDepth\">'.   Type 'string' is not assignable to type 'number'.",
        },
      ]);
    });

    it('INVALID: {q[0].sessions} => refuses to compile, the IMMEDIATE-PARENT condition', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === CHILD_WRONG_HOST);

      expect(result).toStrictEqual([
        {
          file: CHILD_WRONG_HOST,
          line: 10,
          code: 2532,
          message: "Object is possibly 'undefined'.",
        },
      ]);
    });

    it('INVALID: {u[0].comments} => refuses to compile, the ALL-LINKS-SATISFIED condition', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === CHILD_LINKS_UNSATISFIED,
      );

      expect(result).toStrictEqual([
        {
          file: CHILD_LINKS_UNSATISFIED,
          line: 10,
          code: 2532,
          message: "Object is possibly 'undefined'.",
        },
      ]);
    });

    it("INVALID: {under({title}).add(...).operations} => refuses to compile, under() named a field that isn't the link", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === UNDER_LINKS_UNSATISFIED,
      );

      expect(result).toStrictEqual([
        {
          file: UNDER_LINKS_UNSATISFIED,
          line: 13,
          code: 2532,
          message: "Object is possibly 'undefined'.",
        },
      ]);
    });

    it('INVALID: {filter(...)[0]} => refuses to compile, a matched set has no index', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === FILTER_HAS_NO_INDEX,
      );

      expect(result).toStrictEqual([
        {
          file: FILTER_HAS_NO_INDEX,
          line: 10,
          code: 7053,
          message:
            'Element implicitly has an \'any\' type because expression of type \'0\' can\'t be used to index type \'RowVerbs<Ingredient<{ readonly name: "session"; readonly description: "a claude session transcript on disk, addressable by url"; readonly fields: ZodType<{ guildId: string & $brand<"GuildId">; transcript: string & $brand<...>; }, { ...; }, $ZodTypeInternals<...>>; ... 4 more ...; readonly extras: { ...; }; }>> & { ....\'.   Property \'0\' does not exist on type \'RowVerbs<Ingredient<{ readonly name: "session"; readonly description: "a claude session transcript on disk, addressable by url"; readonly fields: ZodType<{ guildId: string & $brand<"GuildId">; transcript: string & $brand<...>; }, { ...; }, $ZodTypeInternals<...>>; ... 4 more ...; readonly extras: { ...; }; }>> & { ....\'.',
        },
      ]);
    });

    it('INVALID: {filter(...).add(...)} => refuses to compile, a matched set has no add', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === FILTER_HAS_NO_ADD);

      expect(result).toStrictEqual([
        {
          file: FILTER_HAS_NO_ADD,
          line: 12,
          code: 2339,
          message:
            'Property \'add\' does not exist on type \'Matched<Ingredient<{ readonly name: "session"; readonly description: "a claude session transcript on disk, addressable by url"; readonly fields: ZodType<{ guildId: string & $brand<"GuildId">; transcript: string & $brand<...>; }, { ...; }, $ZodTypeInternals<...>>; ... 4 more ...; readonly extras: { ...; }; }>>\'.',
        },
      ]);
    });

    it("INVALID: {expect: 'exactly-two'} => refuses to compile, not one of 'one' | 'some' | 'any'", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === BAD_EXPECT);

      expect(result).toStrictEqual([
        {
          file: BAD_EXPECT,
          line: 9,
          code: 2322,
          message: 'Type \'"exactly-two"\' is not assignable to type \'"any" | "some" | "one"\'.',
        },
      ]);
    });

    it("INVALID: {where: {nope: 1}} => refuses to compile, naming 'nope'", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === BAD_WHERE_FIELD);

      expect(result).toStrictEqual([
        {
          file: BAD_WHERE_FIELD,
          line: 9,
          code: 2353,
          message:
            'Object literal may only specify known properties, and \'nope\' does not exist in type \'FieldValuesFor<{ title: string & $brand<"QuestTitle">; userRequest: string & $brand<"QuestUserRequest">; status: "queued" | "accepted" | "underway" | "stalled" | "finished"; guildId: string & $brand<...>; }>\'.',
        },
      ]);
    });

    it("INVALID: {attach({nope: 1}, () => [])} => refuses to compile, naming 'nope'", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === ATTACH_BAD_WHERE_FIELD,
      );

      expect(result).toStrictEqual([
        {
          file: ATTACH_BAD_WHERE_FIELD,
          line: 8,
          code: 2353,
          message:
            'Object literal may only specify known properties, and \'nope\' does not exist in type \'FieldValuesFor<{ title: string & $brand<"QuestTitle">; userRequest: string & $brand<"QuestUserRequest">; status: "queued" | "accepted" | "underway" | "stalled" | "finished"; guildId: string & $brand<...>; } & { ...; }>\'.',
        },
      ]);
    });

    it("INVALID: {db-backed set({status: 'takendown'})} => refuses to compile, re-proving row 3 on the database shape", () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === DB_UNREACHABLE_STATUS,
      );

      expect(result).toStrictEqual([
        {
          file: DB_UNREACHABLE_STATUS,
          line: 12,
          code: 2322,
          message:
            'Type \'"takendown"\' is not assignable to type \'"draft" | "scheduled" | "published"\'.',
        },
      ]);
    });

    it('INVALID: {db-backed where: {nope: 1}} => refuses to compile, re-proving row 11 on the database shape', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === DB_UNKNOWN_COLUMN);

      expect(result).toStrictEqual([
        {
          file: DB_UNKNOWN_COLUMN,
          line: 11,
          code: 2353,
          message:
            'Object literal may only specify known properties, and \'nope\' does not exist in type \'FieldValuesFor<{ title: string & $brand<"PostTitle">; body: string & $brand<"PostBody">; status: "draft" | "scheduled" | "published" | "takendown"; authorId: string & $brand<"UserId">; }>\'.',
        },
      ]);
    });
  });

  describe('the positive fixture tree', () => {
    it('VALID: {every chainable, file-backed} => produces zero diagnostics', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === POSITIVE_EVERY_CHAINABLE,
      );

      expect(result).toStrictEqual([]);
    });

    it('VALID: {every chainable, database-backed} => produces zero diagnostics', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === POSITIVE_EVERY_CHAINABLE_DB,
      );

      expect(result).toStrictEqual([]);
    });

    it('VALID: {the six shape assertions} => produce zero diagnostics', () => {
      registryCreateBrokerProxy();
      const result = suiteDiagnostics.filter(
        (diagnostic) => diagnostic.file === POSITIVE_SHAPE_ASSERTIONS,
      );

      expect(result).toStrictEqual([]);
    });
  });

  describe('the six shape assertions', () => {
    it("VALID: {a literal count} => Handles<…, 3, …>['length'] is 3", () => {
      expect(fixedLengthTupleHolds).toBe(true);
    });

    it("VALID: {a widened count} => Handles<…, number, …>['length'] is number", () => {
      expect(widenedTupleDegradesHolds).toBe(true);
    });

    it("VALID: {Matched<Session>} => 'add' is not one of its keys", () => {
      expect(matchedHasNoAddHolds).toBe(true);
    });

    it("VALID: {Handle<Quest>} => 'sessions' is not one of its keys", () => {
      expect(noSessionsOnQuestHolds).toBe(true);
    });

    it("VALID: {Handle<User>, no ancestors} => 'comments' is not one of its keys", () => {
      expect(noCommentsOnBareUserHolds).toBe(true);
    });

    it("VALID: {Settable<Quest>['status']} => exactly the declared 'to' union", () => {
      expect(transitionNarrowsToDeclaredStatusesHolds).toBe(true);
    });

    it("VALID: {Handle<Session>} => 'withNestedChain' survives as one of its keys", () => {
      expect(withNestedChainSurvivesHolds).toBe(true);
    });
  });
});
