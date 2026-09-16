import { typescriptProgramDiagnosticsAdapter } from './typescript-program-diagnostics-adapter';
import { typescriptProgramDiagnosticsAdapterProxy } from './typescript-program-diagnostics-adapter.proxy';
import { TypeDiagnosticStub } from '../../../contracts/type-diagnostic/type-diagnostic.stub';
import { RepoRelativePathStub, LineCountStub } from '@dungeonmaster/shared/contracts';

// ONE ts.createProgram for the whole suite — a program per test measured 1.1-1.4s each against
// ward's 1000ms testWarnMs bar. Both fixtures ride the same program call, since the adapter
// already accepts multiple files per program; each test reads its own file's slice of the result.
const CLEAN_FIXTURE = RepoRelativePathStub({
  value: 'packages/hydration/test/adapter-fixtures/clean.ts',
});
const ONE_ERROR_FIXTURE = RepoRelativePathStub({
  value: 'packages/hydration/test/adapter-fixtures/one-error.ts',
});
const suiteDiagnostics = typescriptProgramDiagnosticsAdapter({
  files: [CLEAN_FIXTURE, ONE_ERROR_FIXTURE],
});

describe('typescriptProgramDiagnosticsAdapter', () => {
  describe('a program with no errors', () => {
    it('VALID: {files: [clean fixture]} => returns no diagnostics', () => {
      typescriptProgramDiagnosticsAdapterProxy();

      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === CLEAN_FIXTURE);

      expect(result).toStrictEqual([]);
    });
  });

  describe('a program with one deliberate error', () => {
    it('VALID: {files: [fixture with one error]} => returns that diagnostic', () => {
      typescriptProgramDiagnosticsAdapterProxy();

      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === ONE_ERROR_FIXTURE);

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: ONE_ERROR_FIXTURE,
          line: LineCountStub({ value: 1 }),
          code: 2322,
          message: "Type 'number' is not assignable to type 'string'.",
        }),
      ]);
    });
  });
});

// The call-site half of the negative type suite — plan `recipes-chunk-01-03-framework-types.md`
// §4's table, rows 1-11 (7 split into 7a/7b), plus the positive fixture tree's zero-diagnostics
// proof. Housed here, beside the adapter, rather than beside each row's nominal contract owner
// (`hydrationCollectionContract`, `ingredientHandleContract`, `matchedSetContract`) the plan names:
// `contracts/` may import only `statics/`, `errors/`, `contracts/` and zod — never `adapters/` —
// so a contract-folder test cannot call this adapter at all (confirmed by
// `@dungeonmaster/enforce-import-dependencies` refusing the edit). This file's own folder is the
// one place every row can be graded. One `ts.createProgram` for the whole group, computed at
// module scope — see this file's own comment above and the plan's §10b "Two measurements, and
// what they settle". `typescriptProgramDiagnosticsAdapterProxy()` is what each `it` below calls,
// exactly as the two suites above do.
const OUT_OF_BOUNDS = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/out-of-bounds.ts',
});
const UNKNOWN_FIELD = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/unknown-field.ts',
});
const UNREACHABLE_TRANSITION = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/unreachable-transition.ts',
});
const NOT_A_STATUS = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/not-a-status.ts',
});
const EXTRA_NOT_DECLARED = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/extra-not-declared.ts',
});
const EXTRA_ARG_TYPED = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/extra-arg-typed.ts',
});
const CHILD_WRONG_HOST = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/child-wrong-host.ts',
});
const CHILD_LINKS_UNSATISFIED = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/child-links-unsatisfied.ts',
});
const FILTER_HAS_NO_INDEX = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/filter-has-no-index.ts',
});
const FILTER_HAS_NO_ADD = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/filter-has-no-add.ts',
});
const BAD_EXPECT = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/bad-expect.ts',
});
const BAD_WHERE_FIELD = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/call-site/bad-where-field.ts',
});
const POSITIVE_EVERY_CHAINABLE = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/positive/every-chainable.ts',
});
const callSiteFixtureDiagnostics = typescriptProgramDiagnosticsAdapter({
  files: [
    OUT_OF_BOUNDS,
    UNKNOWN_FIELD,
    UNREACHABLE_TRANSITION,
    NOT_A_STATUS,
    EXTRA_NOT_DECLARED,
    EXTRA_ARG_TYPED,
    CHILD_WRONG_HOST,
    CHILD_LINKS_UNSATISFIED,
    FILTER_HAS_NO_INDEX,
    FILTER_HAS_NO_ADD,
    BAD_EXPECT,
    BAD_WHERE_FIELD,
    POSITIVE_EVERY_CHAINABLE,
  ],
});

describe('the malformed call sites that must not compile', () => {
  it('INVALID: {q[3] after add(3, …)} => refuses to compile', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === OUT_OF_BOUNDS,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: OUT_OF_BOUNDS,
        line: LineCountStub({ value: 10 }),
        code: 2493,
        message:
          'Tuple type \'[Handle<{ guilds: Ingredient<{ readonly name: "guild"; readonly description: "a guild the server has registered, with its id and url slug minted"; readonly fields: ZodType<{ path: string & BRAND<"GuildPath">; name: string & BRAND<...>; }, ZodTypeDef, { ...; }>; readonly record: ZodObject<...>; readonly routes: { ......\' of length \'3\' has no element at index \'3\'.',
      }),
    ]);
  });

  it("INVALID: {set({nope: 1})} => refuses to compile, naming 'nope'", () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === UNKNOWN_FIELD,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: UNKNOWN_FIELD,
        line: LineCountStub({ value: 8 }),
        code: 2353,
        message:
          'Object literal may only specify known properties, and \'nope\' does not exist in type \'FieldValuesFor<{ path: string & BRAND<"GuildPath">; name: string & BRAND<"GuildName">; }>\'.',
      }),
    ]);
  });

  it("INVALID: {set({status: 'stalled'})} => refuses to compile, 'stalled' is not in transitions.to", () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === UNREACHABLE_TRANSITION,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: UNREACHABLE_TRANSITION,
        line: LineCountStub({ value: 10 }),
        code: 2322,
        message:
          'Type \'"stalled"\' is not assignable to type \'"queued" | "accepted" | "underway" | "finished"\'.',
      }),
    ]);
  });

  it('INVALID: {set({status: "nonsense"})} => refuses to compile, not a status at all', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === NOT_A_STATUS,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: NOT_A_STATUS,
        line: LineCountStub({ value: 8 }),
        code: 2322,
        message:
          'Type \'"nonsense"\' is not assignable to type \'"queued" | "accepted" | "underway" | "finished"\'.',
      }),
    ]);
  });

  it('INVALID: {q[0].withNestedChain(...)} => refuses to compile, quest declares no such extra', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === EXTRA_NOT_DECLARED,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: EXTRA_NOT_DECLARED,
        line: LineCountStub({ value: 9 }),
        code: 2722,
        message: "Cannot invoke an object which is possibly 'undefined'.",
      }),
    ]);
  });

  it("INVALID: {withNestedChain({depth: 'two'})} => refuses to compile, depth is a number", () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === EXTRA_ARG_TYPED,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: EXTRA_ARG_TYPED,
        line: LineCountStub({ value: 9 }),
        code: 2322,
        message: "Type 'string' is not assignable to type 'number'.",
      }),
    ]);
  });

  it('INVALID: {q[0].sessions} => refuses to compile, the IMMEDIATE-PARENT condition', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === CHILD_WRONG_HOST,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: CHILD_WRONG_HOST,
        line: LineCountStub({ value: 9 }),
        code: 2532,
        message: "Object is possibly 'undefined'.",
      }),
    ]);
  });

  it('INVALID: {u[0].comments} => refuses to compile, the ALL-LINKS-SATISFIED condition', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === CHILD_LINKS_UNSATISFIED,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: CHILD_LINKS_UNSATISFIED,
        line: LineCountStub({ value: 9 }),
        code: 2532,
        message: "Object is possibly 'undefined'.",
      }),
    ]);
  });

  it('INVALID: {filter(...)[0]} => refuses to compile, a matched set has no index', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === FILTER_HAS_NO_INDEX,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: FILTER_HAS_NO_INDEX,
        line: LineCountStub({ value: 10 }),
        code: 7053,
        message:
          'Element implicitly has an \'any\' type because expression of type \'0\' can\'t be used to index type \'RowVerbs<Ingredient<{ readonly name: "session"; readonly description: "a claude session transcript on disk, addressable by url"; readonly fields: ZodType<{ guildId: string & BRAND<"GuildId">; transcript: string & BRAND<...>; }, ZodTypeDef, { ...; }>; ... 4 more ...; readonly extras: { ...; }; }>> & { ...; }\'.   Property \'0\' does not exist on type \'RowVerbs<Ingredient<{ readonly name: "session"; readonly description: "a claude session transcript on disk, addressable by url"; readonly fields: ZodType<{ guildId: string & BRAND<"GuildId">; transcript: string & BRAND<...>; }, ZodTypeDef, { ...; }>; ... 4 more ...; readonly extras: { ...; }; }>> & { ...; }\'.',
      }),
    ]);
  });

  it('INVALID: {filter(...).add(...)} => refuses to compile, a matched set has no add', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === FILTER_HAS_NO_ADD,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: FILTER_HAS_NO_ADD,
        line: LineCountStub({ value: 11 }),
        code: 2339,
        message:
          'Property \'add\' does not exist on type \'Matched<Ingredient<{ readonly name: "session"; readonly description: "a claude session transcript on disk, addressable by url"; readonly fields: ZodType<{ guildId: string & BRAND<"GuildId">; transcript: string & BRAND<...>; }, ZodTypeDef, { ...; }>; ... 4 more ...; readonly extras: { ...; }; }>>\'.',
      }),
    ]);
  });

  it("INVALID: {expect: 'exactly-two'} => refuses to compile, not one of 'one' | 'some' | 'any'", () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === BAD_EXPECT,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: BAD_EXPECT,
        line: LineCountStub({ value: 8 }),
        code: 2322,
        message: 'Type \'"exactly-two"\' is not assignable to type \'"some" | "one" | "any"\'.',
      }),
    ]);
  });

  it("INVALID: {where: {nope: 1}} => refuses to compile, naming 'nope'", () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === BAD_WHERE_FIELD,
    );

    expect(result).toStrictEqual([
      TypeDiagnosticStub({
        file: BAD_WHERE_FIELD,
        line: LineCountStub({ value: 9 }),
        code: 2353,
        message:
          'Object literal may only specify known properties, and \'nope\' does not exist in type \'FieldValuesFor<{ status: "queued" | "accepted" | "underway" | "stalled" | "finished"; title: string & BRAND<"QuestTitle">; userRequest: string & BRAND<"QuestUserRequest">; guildId: string & BRAND<...>; }>\'.',
      }),
    ]);
  });
});

describe('the positive fixture tree', () => {
  it('VALID: {every chainable} => produces zero diagnostics', () => {
    typescriptProgramDiagnosticsAdapterProxy();
    const result = callSiteFixtureDiagnostics.filter(
      (diagnostic) => diagnostic.file === POSITIVE_EVERY_CHAINABLE,
    );

    expect(result).toStrictEqual([]);
  });
});
