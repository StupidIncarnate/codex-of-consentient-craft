/**
 * MALFORMED DECLARATIONS. Every case here must fail to typecheck.
 *
 * The chain's own negatives live in `negative.ts` and guard the CALL SITE. These guard the
 * DECLARATION — an ingredient written wrong, before any recipe uses it. Every one of them
 * compiled clean on the first pass, which is why the file exists.
 */
import type { Contract } from './hydration';
import { createHydration } from './hydration';

type T = { home: string };
const { ingredient, registry } = createHydration<T>();
declare const c: <X>() => Contract<X>;
declare const w: (a: { target: T; fields: Record<string, unknown> }) => Promise<unknown>;

type Fields = { title: string; status: 'a' | 'b' };
type Rec = { id: string };

const base = { description: 'd', fields: c<Fields>(), record: c<Rec>() };

// ---- transitions.field must name a real field
export const badTransitionField = ingredient({
  ...base,
  name: 'bad-transition-field',
  transitions: {
    // @ts-expect-error no such field on `fields`
    field: 'nonexistent',
    to: ['a'],
  },
  routes: { write: w },
  copies: 'x',
});

// ---- transitions.to must hold values THAT FIELD can take
export const badTransitionValue = ingredient({
  ...base,
  name: 'bad-transition-value',
  transitions: {
    field: 'status',
    // @ts-expect-error not a value of `status`
    to: ['a', 'ZZZ_not_a_status'],
  },
  routes: { write: w },
  copies: 'x',
});

// ---- a write route obliges `copies:`
// @ts-expect-error a `write` route with nothing to compare against
export const writeWithoutCopies = ingredient({
  ...base,
  name: 'write-without-copies',
  routes: { write: w },
});

// ---- at least one route
export const noRoutes = ingredient({
  ...base,
  name: 'no-routes',
  // @ts-expect-error an ingredient nothing can make is not an ingredient
  routes: {},
});

// ---- an extra may not shadow a built-in verb
export const extraShadowsVerb = ingredient({
  ...base,
  name: 'extra-shadows-verb',
  routes: { write: w },
  copies: 'x',
  // @ts-expect-error `set` and `remove` belong to the framework
  extras: { set: c<{ depth: number }>(), remove: c<{ hard: boolean }>() },
});

// ---- defaults may only return fields
export const badDefaults = ingredient({
  ...base,
  name: 'bad-defaults',
  // @ts-expect-error `notAField` is not on `fields`
  defaults: () => ({ notAField: 1 }),
  routes: { write: w },
  copies: 'x',
});

// ---- links.as must name a real field on THIS row
export const badLinkField = ingredient({
  ...base,
  name: 'bad-link-field',
  // @ts-expect-error `notAField` is not on `fields`
  links: [{ of: 'somewhere', as: 'notAField' }],
  routes: { write: w },
  copies: 'x',
});

// ---- links.of must name an ingredient the REGISTRY holds
const linksNowhere = ingredient({
  ...base,
  name: 'links-nowhere',
  links: [{ of: 'no-such-ingredient', as: 'title' }],
  routes: { write: w },
  copies: 'x',
});

// @ts-expect-error nothing in this registry is named `no-such-ingredient`
export const danglingLink = registry({ orphans: linksNowhere });
