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
import type { CopiesTarget } from '../copies-target/copies-target-contract';
import { linkSpecContract } from '../link-spec/link-spec-contract';
import type { LinkSpec } from '../link-spec/link-spec-contract';
import { transitionSpecContract } from '../transition-spec/transition-spec-contract';
import type { TransitionSpecFor } from '../transition-spec/transition-spec-contract';
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
 * registry check would degrade to `string extends string`.
 */
export interface IngredientConfig<TTarget, TFields extends object, TName extends string> {
  name: TName;
  description: string;
  fields: z.ZodType<TFields>;
  record: z.ZodType<object>;
  routes: RoutesFor<TTarget>;
  links?: readonly LinkSpec[];
  transitions?: TransitionSpecFor<TFields>;
  defaults?: (index: number) => Partial<TFields>;
  copies?: CopiesTarget;
  extras?: Record<string, { args: z.ZodType<object>; apply: ExtraApplyFn<TTarget> }>;
}

export type ConfigOf<I> = I extends Ingredient<infer C> ? C : never;
export type FieldsOf<I> = ConfigOf<I> extends { fields: z.ZodType<infer T> } ? T : never;
export type RecordOf<I> = ConfigOf<I> extends { record: z.ZodType<infer T> } ? T : never;
export type NameOf<I> = ConfigOf<I> extends { name: infer N } ? N : never;
export type LinkNames<I> = ConfigOf<I> extends { links: readonly { of: infer N }[] } ? N : never;

/** A registry is a map from accessor name to whatever ingredient it inverts. */
export type Registry = Record<string, AnyIngredient>;

type ReservedVerb = (typeof reservedVerbStatics.verbs)[number];
/** An extra may not shadow a built-in verb — derived from `reservedVerbStatics`, never hardcoded. */
export type ExtrasFree<E> = { [K in keyof E]: K extends ReservedVerb ? never : E[K] };
