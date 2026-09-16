/**
 * Type prototype for @dungeonmaster/hydration.
 * Runtime bodies are declared, never implemented: the TYPES are the subject under test.
 */

// ---------------------------------------------------------------- helpers

/** Stands in for a zod contract: carries the inferred shape and nothing else. */
export type Contract<T> = { readonly _type: T };

export type Infer<C> = C extends Contract<infer T> ? T : never;

export type Empty = Record<never, never>;

/** A fixed-length tuple from a LITERAL n. A widened `number` degrades to an array. */
export type Tuple<T, N extends number, R extends T[] = []> = number extends N
  ? T[]
  : R['length'] extends N
    ? R
    : Tuple<T, N, [...R, T]>;

declare const OP: unique symbol;
/** One node of the plan tree. Opaque on purpose — a plan is data, not a call. */
export type Op = { readonly [OP]: true };

// ---------------------------------------------------------------- ingredient

export type Route = 'api' | 'write' | 'recording';

/** Both keys are checked against the ingredient's OWN fields contract. */
export type TransitionSpec<TF> = {
  [K in keyof TF]: { field: K; to: readonly TF[K][] };
}[keyof TF];

/** A link names its parent by NAME, never by reference — see the cycle note below. */
export type LinkSpec<TF> = { of: string; as: keyof TF };

export type RouteFn<TTarget> = (args: { target: TTarget; fields: Record<string, unknown> }) => unknown;

/** At least one route. An ingredient nothing can make is not an ingredient. */
export type RoutesFor<TTarget> =
  | { api: RouteFn<TTarget>; write?: RouteFn<TTarget>; recording?: RouteFn<TTarget> }
  | { write: RouteFn<TTarget>; api?: RouteFn<TTarget>; recording?: RouteFn<TTarget> }
  | { recording: RouteFn<TTarget>; api?: RouteFn<TTarget>; write?: RouteFn<TTarget> };

/** `copies:` is REQUIRED exactly where a `write` route exists. */
type CopiesFor<R> = R extends { write: RouteFn<never> } ? { copies: string } : { copies?: never };

/** An extra may not shadow a built-in verb. */
export type ReservedVerb = 'set' | 'setRaw' | 'remove' | 'saveRecordAs';
export type ExtrasFree<E> = { [K in keyof E]: K extends ReservedVerb ? never : E[K] };

export type IngredientConfig<TTarget = unknown, TF = object> = {
  name: string;
  /** One line, present tense, naming the ROW this makes. Read back by `recipes {}`. */
  description: string;
  fields: Contract<TF>;
  record: Contract<object>;
  routes: RoutesFor<TTarget>;
  links?: readonly LinkSpec<TF>[];
  transitions?: TransitionSpec<TF>;
  defaults?: (index: number) => Partial<TF>;
  copies?: string;
  extras?: Record<string, Contract<object>>;
};

declare const ING: unique symbol;

export type Ingredient<C> = { readonly [ING]: C };
/** Deliberately loose: the brand symbol is private, so only an Ingredient carries it. */
export type AnyIngredient = { readonly [ING]: unknown };

export type ConfigOf<I> = I extends Ingredient<infer C> ? C : never;
export type FieldsOf<I> = ConfigOf<I> extends { fields: Contract<infer T> } ? T : never;
export type RecordOf<I> = ConfigOf<I> extends { record: Contract<infer T> } ? T : never;
export type NameOf<I> = ConfigOf<I> extends { name: infer N } ? N : never;
export type LinkNames<I> = ConfigOf<I> extends { links: readonly { of: infer N }[] } ? N : never;

/**
 * A repo instantiates the framework ONCE with its own target type. A file-backed repo's
 * target is a home directory; a database-backed repo's is a connection. The framework
 * never names either.
 */
export type HydrationFor<TTarget> = {
  ingredient: <TF extends object, const C extends IngredientConfig<TTarget, TF>>(
    config: C & { fields: Contract<TF> } & CopiesFor<C['routes']> & {
      extras?: ExtrasFree<C['extras']>;
    },
  ) => Ingredient<C>;
  registry: <R extends Registry>(
    entries: R &
      (LinkNames<R[keyof R]> extends NameOf<R[keyof R]>
        ? unknown
        : { LINK_NAMES_AN_UNREGISTERED_INGREDIENT: LinkNames<R[keyof R]> }),
  ) => Entry<R>;
  run: <TOut>(plan: Plan<TOut>, target: TTarget) => Promise<TOut>;
};

export declare const createHydration: <TTarget>() => HydrationFor<TTarget>;

// ------------------------------------------------- what `set` accepts

type TransitionField<I> = ConfigOf<I> extends { transitions: { field: infer F } } ? F : never;
type TransitionTo<I> = ConfigOf<I> extends { transitions: { to: readonly (infer V)[] } } ? V : never;

/**
 * A plain field keeps its own type. A TRANSITION field narrows to the end states the
 * ingredient declared — which is how `set({ status })` is enforced per ingredient, and
 * is why a transition needs no verb of its own.
 */
export type Settable<I> = [TransitionField<I>] extends [never]
  ? Partial<FieldsOf<I>>
  : Partial<Omit<FieldsOf<I>, TransitionField<I> & keyof FieldsOf<I>>> & {
      [K in TransitionField<I> & keyof FieldsOf<I>]?: TransitionTo<I>;
    };

// ------------------------------------------------- registry

export type Registry = Record<string, AnyIngredient>;

type ExtraMethods<I> = ConfigOf<I> extends { extras: infer E }
  ? { [K in keyof E]: (args: Infer<E[K]>) => Op }
  : Empty;

type AncestorNames<Anc extends AnyIngredient[]> = NameOf<Anc[number]>;

/**
 * A child accessor exists ONLY where every one of that child's links is satisfied by
 * something already in the ancestor chain. So an unsatisfiable link is not an error
 * message — the accessor is simply not there.
 */
type ChildAccessors<R extends Registry, Host, Anc extends AnyIngredient[]> = {
  [K in keyof R as [LinkNames<R[K]>] extends [never]
    ? never
    : NameOf<Host> extends LinkNames<R[K]>
      ? LinkNames<R[K]> extends AncestorNames<Anc>
        ? K
        : never
      : never]: Collection<R, R[K], Anc>;
};

// ------------------------------------------------- one row

export type Saved<T> = { readonly _saved: T };

export declare const fromSaved: <T>(args: { name: string; field?: keyof T }) => Saved<T>;

type RowVerbs<I> = {
  set: (values: Settable<I>) => Op;
  /** Writes a transition field and walks NOTHING. The deliberate odd one. */
  setRaw: (values: Partial<FieldsOf<I>>) => Op;
  /** The whole RECORD, not only its ids — server-assigned fields included. */
  saveRecordAs: (args: { name: string }) => Op;
  remove: () => Op;
};

export type Handle<R extends Registry, I, Anc extends AnyIngredient[]> = RowVerbs<I> &
  ExtraMethods<I> &
  ChildAccessors<R, I, [I & AnyIngredient, ...Anc]>;

/** What `filter` returns. No index access and no `add`: the count is a RUN-TIME fact. */
export type Matched<I> = RowVerbs<I>;

/**
 * A PURE tuple. `all` is a second callback argument rather than a property here, because
 * `Tuple<T, N> & { all: T }` silently loses the out-of-bounds check — measured.
 */
export type Handles<R extends Registry, I, N extends number, Anc extends AnyIngredient[]> = Tuple<
  Handle<R, I, Anc>,
  N
>;

// ------------------------------------------------- a collection of rows

export type FilterArgs<I> = {
  where: Partial<FieldsOf<I>>;
  /** Reuses the tool's own no-pick rule. Default `some`: a zero match THROWS. */
  expect?: 'one' | 'some' | 'any';
};

export type Collection<R extends Registry, I, Anc extends AnyIngredient[] = []> = {
  add: <const N extends number>(
    count: N,
    build: (rows: Handles<R, I, N, Anc>, all: Handle<R, I, Anc>) => Op[],
  ) => Op;
  filter: (args: FilterArgs<I>) => Matched<I>;
  /** Supplies a link from a recipe INPUT rather than from an ancestor. */
  under: (ids: Partial<FieldsOf<I>>) => Collection<R, I, Anc>;
};

/** Entry points: one per registered ingredient that needs no ancestor. */
export type Entry<R extends Registry> = { [K in keyof R]: Collection<R, R[K], []> };

// ------------------------------------------------- recipes and plans

declare const PLAN: unique symbol;
export type Plan<TOut> = { readonly [PLAN]: TOut };

export type RecipeDef<TName extends string, TInput> = {
  recipeName: TName;
  description: string;
  (input: TInput): Plan<Record<string, unknown>>;
};

// The no-input overload is FIRST: `() => Op[]` also satisfies the input form, so the
// input overload would otherwise win and demand an argument nobody has.
export declare function recipe<TName extends string>(
  meta: { name: TName; description: string },
  build: () => Op[],
): RecipeDef<TName, void>;

export declare function recipe<TName extends string, TInput extends object>(
  meta: { name: TName; description: string },
  build: (input: TInput) => Op[],
): RecipeDef<TName, TInput>;

// ------------------------------------------------- running a plan

// `run` is served by `createHydration`, so the target it takes is the repo's own.
