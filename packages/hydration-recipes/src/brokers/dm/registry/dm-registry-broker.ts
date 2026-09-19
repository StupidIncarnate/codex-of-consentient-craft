/**
 * PURPOSE: The one place every ingredient this repo declares is named — `registry()` is where a
 * duplicate `name` and a dangling `links.of` are caught, both by the framework's own
 * `registryCreateBroker`, not reimplemented here. Reach for `dmRegistryBroker` over calling
 * `registry({...})` again anywhere else in this package: a second call makes a second registry,
 * and a `links.of` resolved against the wrong one fails with a message naming a key that is right
 * there in THIS one.
 *
 * `run` and `listing` are both bundled onto the SAME object rather than left for a caller to fetch
 * off its own `recipesHydrationCreateBroker()` call — measured, not a style choice.
 * `hydrationCreateBroker<TTarget>()` closes `registeredIngredients` over ONE instance, and
 * `registry()` is what populates it; `run()` and `listing()` both read it back. Two separate
 * `recipesHydrationCreateBroker()` calls are two separate closures, so a `run` or `listing` fetched
 * from a FRESH call sees an empty ingredient list — every `filter`/`update`/`remove` a `run` of the
 * plan reaches then fails preflight with `HydrationRouteVerbUnavailableError` naming a route that
 * really is declared, and a `listing` reports `needsServerFor` on the first created ingredient even
 * when that ingredient really does declare a `write` route — because in both cases the call is
 * asking a registry that was never told about it. `ingredient()` and `recipe()` stay stateless
 * (confirmed by reading `hydration-create-broker.ts`: neither touches `registeredIngredients`), so
 * every ingredient and recipe file in this package may keep calling `recipesHydrationCreateBroker()`
 * on its own — only `registry()`, `run()` and `listing()` must share one call.
 *
 * The accessor keys are plural, matching every worked example in
 * `scrolls/seigelense/siegelense-recipes.md` (`dm.guilds`, `dm.quests`, …). `subagents` links to
 * BOTH `session` and `guild`, so it appears only on a session row's own accessor
 * (`s[0].subagents`) — a guild alone cannot supply the `sessionId` its link needs, and the type
 * system enforces that, not this file.
 *
 * USAGE:
 * const plan = dmRegistryBroker.guilds.add(1, (g) => [
 *   g[0].sessions.add(1, (s) => [s[0].subagents.add(1, (a) => [a[0].set({ lines: ['...'] })])]),
 *   g[0].quests.add(1, (q) => [q[0].operations.add(1, (o) => [o[0].set({ role: 'ward' })])]),
 * ]);
 * await dmRegistryBroker.run(somePlan, target);
 * const { runs, makes } = dmRegistryBroker.listing(somePlan);
 */
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { guildIngredientBroker } from '../../guild/ingredient/guild-ingredient-broker';
import { operationIngredientBroker } from '../../operation/ingredient/operation-ingredient-broker';
import { questIngredientBroker } from '../../quest/ingredient/quest-ingredient-broker';
import { sessionIngredientBroker } from '../../session/ingredient/session-ingredient-broker';
import { subagentIngredientBroker } from '../../subagent/ingredient/subagent-ingredient-broker';

const { registry, run, listing } = recipesHydrationCreateBroker();

const dm = registry({
  guilds: guildIngredientBroker,
  quests: questIngredientBroker,
  operations: operationIngredientBroker,
  sessions: sessionIngredientBroker,
  subagents: subagentIngredientBroker,
});

export const dmRegistryBroker = { ...dm, run, listing };
