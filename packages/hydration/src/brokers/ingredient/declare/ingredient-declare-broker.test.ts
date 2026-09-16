import { ingredientDeclareBroker } from './ingredient-declare-broker';
import { ingredientDeclareBrokerProxy } from './ingredient-declare-broker.proxy';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { reservedVerbStatics } from '../../../statics/reserved-verb/reserved-verb-statics';
import { typescriptProgramDiagnosticsAdapter } from '../../../adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter';
import { TypeDiagnosticStub } from '../../../contracts/type-diagnostic/type-diagnostic.stub';
import { RepoRelativePathStub, LineCountStub } from '@dungeonmaster/shared/contracts';

// ONE ts.createProgram for the whole suite, computed at module scope — a program per test measured
// 1.1-1.4s each against ward's 1000ms testWarnMs bar (see the adapter's own suite, and the plan's
// §10b "Two measurements, and what they settle"). Every fixture-owning `it` below reads its own
// file's slice of this one result rather than compiling its own program.
const BAD_TRANSITION_FIELD = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/bad-transition-field.ts',
});
const BAD_TRANSITION_VALUE = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/bad-transition-value.ts',
});
const WRITE_WITHOUT_COPIES = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/write-without-copies.ts',
});
const NO_ROUTES = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/no-routes.ts',
});
const EXTRA_NAMED_SET = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/extra-named-set.ts',
});
const EXTRA_NAMED_REMOVE = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/extra-named-remove.ts',
});
const BAD_DEFAULTS = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/bad-defaults.ts',
});
const BAD_LINK_FIELD = RepoRelativePathStub({
  value: 'packages/hydration/test/type-fixtures/declaration/bad-link-field.ts',
});
const declarationFixtureDiagnostics = typescriptProgramDiagnosticsAdapter({
  files: [
    BAD_TRANSITION_FIELD,
    BAD_TRANSITION_VALUE,
    WRITE_WITHOUT_COPIES,
    NO_ROUTES,
    EXTRA_NAMED_SET,
    EXTRA_NAMED_REMOVE,
    BAD_DEFAULTS,
    BAD_LINK_FIELD,
  ],
});

describe('ingredientDeclareBroker', () => {
  describe('valid declarations', () => {
    it('VALID: {the quest ingredient} => returns the config unchanged', () => {
      ingredientDeclareBrokerProxy();
      const config = IngredientConfigStub();

      const result = ingredientDeclareBroker(config as never);

      expect(result).toStrictEqual(config);
    });

    it('VALID: {defaults: (i) => title varies by index} => defaults(0) and defaults(1) differ', () => {
      ingredientDeclareBrokerProxy();
      const defaults = (index: number): Record<string, unknown> => ({
        title: `Quest ${index + 1}`,
      });
      const config = IngredientConfigStub({ defaults: defaults as never });

      ingredientDeclareBroker(config as never);

      expect(defaults(0)).toStrictEqual({ title: 'Quest 1' });
      expect(defaults(1)).toStrictEqual({ title: 'Quest 2' });
    });
  });

  describe('invalid declarations', () => {
    it('INVALID: {routes: {}} => throws \'ingredient "quest" declares no routes\'', () => {
      ingredientDeclareBrokerProxy();
      const config = { ...IngredientConfigStub() };
      Reflect.deleteProperty(config.routes, 'write');

      expect(() => ingredientDeclareBroker(config as never)).toThrow(
        /^ingredient "quest" declares no routes$/u,
      );
    });

    it("INVALID: {routes: {write}, no copies} => throws naming 'copies' and 'quest'", () => {
      ingredientDeclareBrokerProxy();
      const config = { ...IngredientConfigStub() };
      Reflect.deleteProperty(config, 'copies');

      expect(() => ingredientDeclareBroker(config as never)).toThrow(
        /^ingredient "quest" declares a 'write' route and must declare 'copies'$/u,
      );
    });

    it.each(reservedVerbStatics.verbs)(
      'INVALID: {extras: {%s}} => throws naming the reserved verb',
      (verb) => {
        ingredientDeclareBrokerProxy();
        const apply = (): unknown => undefined;
        const extraEntry = Object.fromEntries([
          ['args', Object.fromEntries([])],
          ['apply', apply],
        ]);
        const extras = Object.fromEntries([[verb, extraEntry]]);
        const config: Record<string, unknown> = { ...IngredientConfigStub() };
        config.extras = extras;

        expect(() => ingredientDeclareBroker(config as never)).toThrow(
          new RegExp(
            `^ingredient "quest" declares an extra named '${verb}', which the framework already owns$`,
            'u',
          ),
        );
      },
    );
  });

  // The declaration half of the negative type suite — plan `recipes-chunk-01-03-framework-types.md`
  // §4's table, rows D1-D8. Each fixture under `test/type-fixtures/declaration/` holds exactly one
  // deliberate compile error; a real `tsc` run (`typescriptProgramDiagnosticsAdapter`) is the only
  // thing that can prove a declaration refuses to compile, since none of these eight is an
  // assignability question a type-level `Equal` helper could answer (excess-property checking,
  // contextual typing through a generic inference site — see the plan's own rationale table).
  // `ingredientDeclareBrokerProxy()` — not the adapter's own proxy — is what each `it` below calls:
  // a test file may import only its own colocated proxy, and the adapter's own proxy is empty
  // (`Record<PropertyKey, never>`) regardless, since it is a DSL adapter that runs real.
  // D9 (`links.of` naming an unregistered ingredient) fires at the REGISTRY, and
  // `registryCreateBroker` is not on disk yet — its fixture
  // (`test/type-fixtures/declaration/dangling-link.ts`) is written and documented as pending; no
  // test here feeds it to the adapter, so as not to invent the registry mechanism to make an
  // assertion pass.
  describe('the malformed declarations that must not compile', () => {
    it("INVALID: {transitions.field names no field on this ingredient's fields} => refuses to compile", () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === BAD_TRANSITION_FIELD,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: BAD_TRANSITION_FIELD,
          line: LineCountStub({ value: 21 }),
          code: 2322,
          message: 'Type \'"nonexistent"\' is not assignable to type \'"status" | "title"\'.',
        }),
      ]);
    });

    it('INVALID: {transitions.to holds a value that field cannot take} => refuses to compile', () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === BAD_TRANSITION_VALUE,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: BAD_TRANSITION_VALUE,
          line: LineCountStub({ value: 18 }),
          code: 2322,
          message:
            'Type \'"ZZZ_not_a_status"\' is not assignable to type \'"queued" | "accepted" | "underway" | "stalled" | "finished"\'.',
        }),
      ]);
    });

    it('INVALID: {a write route with no copies} => refuses to compile', () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === WRITE_WITHOUT_COPIES,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: WRITE_WITHOUT_COPIES,
          line: LineCountStub({ value: 8 }),
          code: 2345,
          message:
            'Argument of type \'{ name: "write-without-copies"; description: "a write route with nothing to compare against"; fields: ZodType<{ status: "queued" | "accepted" | "underway" | "stalled" | "finished"; title: string & BRAND<...>; }, ZodTypeDef, { ...; }>; record: ZodObject<...>; routes: { ...; }; }\' is not assignable to parameter of type \'{ readonly name: "write-without-copies"; readonly description: "a write route with nothing to compare against"; readonly fields: ZodType<{ status: "queued" | "accepted" | "underway" | "stalled" | "finished"; title: string & BRAND<...>; }, ZodTypeDef, { ...; }>; readonly record: ZodObject<...>; readonly routes: { ......\'.   Property \'copies\' is missing in type \'{ name: "write-without-copies"; description: "a write route with nothing to compare against"; fields: ZodType<{ status: "queued" | "accepted" | "underway" | "stalled" | "finished"; title: string & BRAND<...>; }, ZodTypeDef, { ...; }>; record: ZodObject<...>; routes: { ...; }; }\' but required in type \'{ copies: string; }\'.',
        }),
      ]);
    });

    it('INVALID: {no routes at all} => refuses to compile', () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === NO_ROUTES,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: NO_ROUTES,
          line: LineCountStub({ value: 13 }),
          code: 2322,
          message: "Type '{}' is not assignable to type 'RoutesFor<DmTarget>'.",
        }),
      ]);
    });

    it('INVALID: {an extra named set, shadowing a built-in verb} => refuses to compile', () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === EXTRA_NAMED_SET,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: EXTRA_NAMED_SET,
          line: LineCountStub({ value: 18 }),
          code: 2322,
          message:
            'Type \'{ args: z.ZodObject<{ depth: z.ZodBranded<z.ZodNumber, "ChainDepth">; }, "strip", z.ZodTypeAny, { depth: number & z.BRAND<"ChainDepth">; }, { depth: number; }>; apply: () => unknown; }\' is not assignable to type \'never\'.',
        }),
      ]);
    });

    it('INVALID: {a second extra named remove, shadowing a different built-in verb} => refuses to compile', () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === EXTRA_NAMED_REMOVE,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: EXTRA_NAMED_REMOVE,
          line: LineCountStub({ value: 18 }),
          code: 2322,
          message:
            "Type '{ args: z.ZodObject<{ hard: z.ZodBoolean; }, \"strip\", z.ZodTypeAny, { hard: boolean; }, { hard: boolean; }>; apply: () => unknown; }' is not assignable to type 'never'.",
        }),
      ]);
    });

    it('INVALID: {defaults returning a field that does not exist} => refuses to compile', () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === BAD_DEFAULTS,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: BAD_DEFAULTS,
          line: LineCountStub({ value: 13 }),
          code: 2322,
          message:
            'Type \'() => { notAField: number; }\' is not assignable to type \'(index: number) => Partial<{ status: "queued" | "accepted" | "underway" | "stalled" | "finished"; title: string & BRAND<"SampleTitle">; }>\'.   Type \'{ notAField: number; }\' has no properties in common with type \'Partial<{ status: "queued" | "accepted" | "underway" | "stalled" | "finished"; title: string & BRAND<"SampleTitle">; }>\'.',
        }),
      ]);
    });

    it("INVALID: {a link's as names no field on this row} => refuses to compile", () => {
      ingredientDeclareBrokerProxy();
      const result = declarationFixtureDiagnostics.filter(
        (diagnostic) => diagnostic.file === BAD_LINK_FIELD,
      );

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: BAD_LINK_FIELD,
          line: LineCountStub({ value: 13 }),
          code: 2322,
          message:
            'Type \'"notAField"\' is not assignable to type \'requiredKeys<baseObjectOutputType<{ title: ZodBranded<ZodString, "SampleTitle">; status: ZodEnum<["queued", "accepted", "underway", "stalled", "finished"]>; }>>\'.',
        }),
      ]);
    });
  });
});
