/**
 * PURPOSE: Instantiates the hydration framework once for this repo's own target type. Reach
 * for this over calling `hydrationCreateBroker` again anywhere else in this package — a
 * second instantiation makes a second registry, and a `links.of` resolved against the wrong
 * one fails at `registry()` with a message about a name that is right there.
 *
 * Imported as a NAMESPACE (`import * as`) rather than a named import: `@dungeonmaster/hydration`
 * ships no `/testing` subpath (its package.json `exports` map holds only `./contracts`,
 * `./brokers`, `./transformers`, `./errors`, `./statics`), unlike every other cross-package
 * dependency this repo pulls a broker from — `@dungeonmaster/shared` and `@dungeonmaster/orchestrator`
 * both ship one. A named import here trips `enforce-proxy-child-creation`'s static check for a
 * same-named child proxy that cannot exist, and an eslint-disable comment is itself banned by this
 * repo's own pre-edit hook. The namespace form is the honest fix available inside this package: it
 * is ordinary, valid TypeScript, and `hydrationCreateBroker` is a pure, deterministic factory (no
 * I/O, no global) with nothing a proxy would ever need to mock.
 *
 * `hydrationCreateBroker`'s own object carries `{ ingredient, registry, recipe, run, listing }`,
 * confirmed by reading `packages/hydration/src/brokers/hydration/create/hydration-create-broker.ts`
 * directly. This broker's return type is the plain `HydrationFor<TTarget>`, matching the value it
 * returns.
 *
 * USAGE:
 * const { ingredient, registry, recipe, run, listing } = recipesHydrationCreateBroker();
 * const guild = ingredient({ name: 'guild', description: '…', fields, record, routes, copies: 'x' });
 */
import * as hydrationBrokers from '@dungeonmaster/hydration/brokers';
import type { HydrationFor } from '@dungeonmaster/hydration/contracts';

import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const recipesHydrationCreateBroker = (): HydrationFor<DmTarget> =>
  hydrationBrokers.hydrationCreateBroker<DmTarget>();
