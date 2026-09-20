/**
 * PURPOSE: Everything one ingredient declares about itself — the two contracts, the routes, and
 * whatever it opts into. Reach for this when writing an ingredient; reach for
 * `hydrationRoutesContract` alone when the question is only how a row gets made. A `write` route
 * with no `copies` is refused here, at declare time, not left for a diagnosis to discover later.
 *
 * Each `extras` entry is `{ args, apply }` — one object, never a bare contract. `args` types what
 * the caller passes; `apply` is the body the runner calls to do it. A contract with no `apply`
 * types a verb with nothing to run, so the two are declared together or not at all.
 *
 * USAGE:
 * ingredientConfigContract.parse({
 *   name: 'quest',
 *   description: 'one quest under a guild',
 *   fields: questFieldsContract,
 *   record: questRecordContract,
 *   routes: { write: ({ target, fields }) => hydrate({ target, fields }) },
 *   copies: 'questPersistBroker',
 *   extras: {
 *     advanceOneStep: { args: advanceArgsContract, apply: ({ target, record, args }) => advance({ target, record, args }) },
 *   },
 * });
 * // Returns IngredientConfigData
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import { copiesTargetContract } from '../copies-target/copies-target-contract';
import { linkSpecContract } from '../link-spec/link-spec-contract';
import type { LinkSpecFor } from '../link-spec/link-spec-contract';
import { transitionSpecContract } from '../transition-spec/transition-spec-contract';
import type { TransitionSpecWithReachFor } from '../transition-spec/transition-spec-contract';
import { hydrationRoutesContract } from '../hydration-routes/hydration-routes-contract';
import type { RoutesFor } from '../hydration-routes/hydration-routes-contract';
import { extraVerbNameContract } from '../extra-verb-name/extra-verb-name-contract';
import type { reservedVerbStatics } from '../../statics/reserved-verb/reserved-verb-statics';

// `fields`, `record` and each `extras` entry are zod schemas, not data — `z.custom` with no type
// argument (so it infers `unknown`) checks the shape at runtime and hands the same reference back,
// exactly as `routeFnContract` does for a route function. Typing it any narrower re-triggers
// `StubArgument`'s object-property expansion over a `ZodTypeAny`'s own many methods.
const zodSchemaContract = z.custom((value) => value instanceof z.ZodType, {
  message: 'Expected a zod schema',
});

const ingredientDescriptionContract = z.string().min(1).brand<'IngredientDescription'>();

const ingredientDefaultsFnContract = z.custom<(index: number) => Record<string, unknown>>(
  (value) => typeof value === 'function',
  { message: 'Expected a defaults function' },
);

/** What runs when a caller reaches for an ingredient's own extra verb. Kept as a bare function
 * check, exactly like `routeFnContract` — a function has no shape a parse can compare. */
export type ExtraApplyFn<TTarget> = (args: {
  target: TTarget;
  record: Record<string, unknown>;
  args: Record<string, unknown>;
}) => unknown;

const extraApplyFnContract = z.custom<ExtraApplyFn<unknown>>(
  (value) => typeof value === 'function',
  { message: 'Expected an extra apply function' },
);

/** One extra verb: the contract typing its arguments, and the body the runner calls to run it.
 * Declaring `args` with no `apply` (or the reverse) leaves a verb nothing can run, so both are
 * required together. */
const extraContract = z.object({
  args: zodSchemaContract,
  apply: extraApplyFnContract,
});

export const ingredientConfigContract = z
  .object({
    name: ingredientNameContract,
    description: ingredientDescriptionContract,
    fields: zodSchemaContract,
    record: zodSchemaContract,
    routes: hydrationRoutesContract,
    links: z.array(linkSpecContract).optional(),
    transitions: transitionSpecContract.optional(),
    defaults: ingredientDefaultsFnContract.optional(),
    copies: copiesTargetContract.optional(),
    extras: z.record(extraVerbNameContract, extraContract).optional(),
  })
  .superRefine((config, ctx) => {
    if (config.routes.write !== undefined && config.copies === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ingredient '${config.name}' declares a 'write' route and must declare 'copies'`,
        path: ['copies'],
      });
    }
  });

export type IngredientConfigData = z.infer<typeof ingredientConfigContract>;

/**
 * The real runtime shape behind `record` (and `fields`, and each `extras.*.args`) — stored as
 * `unknown` on `IngredientConfigData` because `zodSchemaContract` is a bare `z.custom()` with no
 * type argument (see that const's own comment), but genuinely a `z.ZodType` once
 * `ingredientConfigContract.parse` has accepted it. Reach for this wherever a caller OUTSIDE
 * `contracts/` needs to call `.safeParse` on one of those fields — only a `contracts/` file may
 * import `zod` itself, so this is the one place that shape can be named elsewhere.
 */
export type AnyZodSchema = z.ZodType;

/**
 * `AnyZodSchema` narrowed to the one shape a `record` contract is always declared as — an
 * `ingredient()` call passes a `z.object({...})`, never a bare `z.string()` or `z.union()`, so
 * `.shape` is genuinely there once `ingredientConfigContract.parse` has accepted it. Reach for this
 * over `AnyZodSchema` wherever a caller outside `contracts/` needs the record's OWN field names —
 * a bare `z.ZodType` exposes no `.shape` to read them off.
 */
export type AnyZodObjectSchema = z.ZodObject<z.ZodRawShape>;

declare const ING: unique symbol;

/** Opaque on purpose — a declared ingredient is a token later chunks pass around, not a record. */
export interface Ingredient<C> {
  readonly [ING]: C;
}
/** Deliberately loose: the brand symbol is private, so only an `Ingredient` carries it. */
export interface AnyIngredient {
  readonly [ING]: unknown;
}

/**
 * The raw shape a caller writes to `ingredient({...})`, before `ingredientDeclareBroker` parses it
 * through `ingredientConfigContract`. `TName` stays a bare literal-preserving parameter — branding
 * it would widen every `const C extends IngredientConfig<...>` capture back to `string`, and D9's
 * registry check would degrade to `string extends string`. The default lets a caller reference this
 * interface with only `TTarget`/`TFields` filled in (a target-bound helper that has no reason to
 * name its own placeholder `TName`) — `const C` still captures each ARGUMENT's own literal `name`,
 * because the default only widens the CONSTRAINT, never the inferred value checked against it.
 */
export interface IngredientConfig<TTarget, TFields extends object, TName extends string = string> {
  name: TName;
  description: string;
  // Zod's OWN `_output` phantom carrier, never `z.ZodType<TFields>` directly — see
  // `IngredientConfigInferenceAnchor`'s own comment. `C extends IngredientConfig<...>` is a real
  // assignability CHECK, not just an inference site, so this interface needs the same fix its
  // anchor does: a real `z.object({...})` value's assignability to `z.ZodType<T>` routes through
  // `ZodObject`'s OWN methods — `deepPartial()` among them — and fails for a shape holding branded
  // fields even though the schema is perfectly valid.
  fields: { readonly _output: TFields };
  record: z.ZodType<object>;
  routes: RoutesFor<TTarget>;
  // `TParentName` is bare `string` at declare time — nothing has registered this ingredient's
  // parents yet. `registryCreateBroker` narrows `of` against real registered names later (D9);
  // narrowing it here as well would make every ingredient depend on its parents' names existing
  // before it does, which is the reference cycle links are named (never held) to avoid.
  links?: readonly LinkSpecFor<TFields, string>[];
  transitions?: TransitionSpecWithReachFor<TTarget, TFields>;
  defaults?: (index: number) => Partial<TFields>;
  // Bare `string`, not the branded `CopiesTarget` — a caller writes a plain literal
  // (`copies: 'questPersistBroker'`) here, and `ingredientConfigContract.parse` is what brands it.
  copies?: string;
  extras?: Record<string, { args: z.ZodType<object>; apply: ExtraApplyFn<TTarget> }>;
}

/**
 * Gives a generic broker a direct inference site for `TFields`/`TName`. Both appear only inside
 * ANOTHER type parameter's constraint in `ingredientDeclareBroker`'s own signature (`const C
 * extends IngredientConfig<TTarget, TFields, TName>`), which is too deep for the compiler to solve
 * from — intersecting this onto the parameter type gives each one a top-level property to infer
 * from directly.
 *
 * `fields` is typed by zod's OWN `_output` phantom carrier, never `IngredientConfig['fields']`
 * directly — even though that field now uses the SAME `_output` carrier (see its own comment), a
 * caller's `fields` value is a concrete `ZodObject<Shape>`, and re-checking that concrete class
 * against TWO independently-inferred `{ readonly _output: TFields }` sites (this one and `C`'s own
 * constraint) reintroduces the `deepPartial()` method-comparison failure `_output` exists to avoid.
 * A caller widens `fields` to `z.ZodType<InferredFields>` at the declaration site — an upcast along
 * zod's own class hierarchy, not a brand mismatch — so only ONE concrete class ever needs comparing
 * against `_output`. `TTarget` has no site here: it is a union across three route shapes the
 * compiler cannot invert from a concrete object, so a caller of this broker directly supplies it as
 * an explicit type argument instead.
 */
export interface IngredientConfigInferenceAnchor<
  TFields extends object,
  TName extends string = string,
> {
  name: TName;
  fields: { readonly _output: TFields };
}

export type ConfigOf<I> = I extends Ingredient<infer C> ? C : never;
// Matches the phantom `_output` shape `IngredientConfig.fields` itself now carries, not a full
// `z.ZodType<T>` — see that field's own comment for why.
export type FieldsOf<I> = ConfigOf<I> extends { fields: { readonly _output: infer T } } ? T : never;
export type RecordOf<I> = ConfigOf<I> extends { record: z.ZodType<infer T> } ? T : never;
export type NameOf<I> = ConfigOf<I> extends { name: infer N } ? N : never;
export type LinkNames<I> = ConfigOf<I> extends { links: readonly { of: infer N }[] } ? N : never;

/** Every one of I's own declared links, kept as separate objects — `under()` needs to pair each
 * link's `of` with its own `as` field, which `LinkNames` already collapses into one union. */
export type LinkSpecsOf<I> = ConfigOf<I> extends { links: readonly (infer L)[] } ? L : never;

/**
 * Which of `LinkSpecsOf<I>`'s entries has an `as` field that is a key of `Ids` — `L` is a bare
 * parameter here, unlike `ChildAccessors`'s deliberately non-distributive "every link" check, so
 * this distributes per link and keeps only the ones `Ids` actually names.
 */
export type LinkAncestorName<L, Ids> = L extends { of: infer O; as: infer A }
  ? A extends keyof Ids
    ? O
    : never
  : never;

/**
 * The ancestor names `under(ids)` may honestly contribute for THIS ingredient: only a link whose
 * `as` field `Ids` actually supplies a value for — never every link I declares regardless of what
 * was passed, which would let one unrelated field unlock a grandchild that field says nothing about.
 */
export type SuppliedAncestorNames<I, Ids> = LinkAncestorName<LinkSpecsOf<I>, Ids>;

/**
 * A phantom ancestor `under()` may add to the chain — real enough for `NameOf` to read a name off
 * it, and nothing else. `under()` supplies an id, not a row: this carries no `ref` and no created
 * row, so nothing downstream can mistake it for either.
 */
export type UnderAncestor<I, Ids> = Ingredient<{ name: SuppliedAncestorNames<I, Ids> }>;

/** A registry is a map from accessor name to whatever ingredient it inverts. */
export type Registry = Record<string, AnyIngredient>;

type ReservedVerb = (typeof reservedVerbStatics.verbs)[number];
/** An extra may not shadow a built-in verb — derived from `reservedVerbStatics`, never hardcoded. */
export type ExtrasFree<E> = { [K in keyof E]: K extends ReservedVerb ? never : E[K] };
