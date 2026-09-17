// B5 — an ingredient linking two levels up, skipping the immediate host. Three readings against a
// REAL declaration: `subagent-ingredient-broker.ts`'s own `links` name `session` and `guild`, never
// `subagent` itself.
//
// (1) baseline — `s[0].subagents` (host = session, one of subagent's own links) should compile.
// (2) skip-one — `g[0].subagents` (host = guild, satisfies ONE link but not the immediate-host
//     rule, since subagent's links name `session` too and guild alone cannot supply it) should NOT.
// (3) the real lead — `recipes-chunk-07-repo-ingredients.md:308` suggests
//     `a[0].subagents.add(1, …)` for a nested sub-agent chain, but `subagent`'s own links never
//     name `subagent`, so a subagent row should have no `.subagents` accessor at all.
//
// No suppression comment: the point of (2) and (3) IS the diagnostic, read by
// `typescriptProgramDiagnosticsAdapter` in the sibling `b5-run.ts`.
import { dmRegistryBroker } from '../../packages/siegelense-recipes/src/brokers/dm/registry/dm-registry-broker';

export const baselineViaSession = dmRegistryBroker.guilds.add(1, (g) => [
  g[0].sessions.add(1, (s) => [s[0].subagents.add(1, () => [])]),
]);

export const skipOneViaGuild = dmRegistryBroker.guilds.add(1, (g) => [g[0].subagents.add(1, () => [])]);

export const nestedSubagentAttempt = dmRegistryBroker.guilds.add(1, (g) => [
  g[0].sessions.add(1, (s) => [
    s[0].subagents.add(1, (a) => [a[0].subagents.add(1, () => [])]),
  ]),
]);
