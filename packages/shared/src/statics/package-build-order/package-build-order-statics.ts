/**
 * PURPOSE: The order package KINDS are built in, as tiers — the primary key the derived codeweaver
 * ledger is sorted on, ahead of the manifest-derived `quest.packageGraph` depth
 *
 * USAGE:
 * packageBuildOrderStatics.tiers;
 * // Returns the tiers in build order; a package's rank is the index of the tier holding its kind
 *
 * WHY A TIER LIST AND NOT JUST THE MANIFEST DEPTH. `packageGraph` depth is Kahn's order over the
 * workspace manifests, which encodes the BUILD dependency. Across an HTTP seam that is not the WORK
 * dependency, and it can be outright inverted. Measured in this repo: `packages/server` depends on
 * `@dungeonmaster/web` because it serves the built bundle, while `packages/web` depends only on
 * `@dungeonmaster/shared`. Kahn therefore ranks shared 0, orchestrator 1, WEB 1, SERVER 2 — putting
 * the browser package ahead of the backend it calls. A web session scheduled first would build an
 * action bar against `POST /api/quests/:questId/followup` before anything served that route.
 *
 * The kind is the honest signal there, because the seam that the manifest cannot see is exactly the
 * seam the kinds describe: a `frontend-*` package consumes an `http-backend` one over the wire, and
 * no `package.json` edge records it. Depth still decides WITHIN a tier, where the manifests are
 * telling the truth — two libraries, one importing the other.
 *
 * The flow graph was considered as the edge source and rejected: its edges are CALL direction, and a
 * terminal node routinely renders backend work into the UI (`#stamp-git-context` orchestrator →
 * `#quest-running` web), so reversing them puts the frontend first again.
 *
 * This is DATA only (statics may import statics, never contracts), so the tuple cannot import
 * `packageTypeContract`. The colocated test asserts the flattened tiers are 1:1 with that contract's
 * options — a kind added there without a tier here would silently rank last and schedule a provider
 * after its consumer.
 */

export const packageBuildOrderStatics = {
  tiers: [
    // Pure providers. Nothing in the workspace can be built against them until they exist.
    ['library'],
    // Services composed from libraries, consumed in-process by whatever fronts them.
    ['programmatic-service', 'mcp-server'],
    // Fronts the services over a transport. Everything below consumes it across a wire.
    ['http-backend'],
    // Consume the backend over HTTP/WebSocket — the seam no manifest edge records, and the whole
    // reason this list outranks depth.
    ['frontend-react', 'frontend-ink'],
    // Tooling leaves: they wrap the rest and nothing in the product graph consumes them back.
    ['cli-tool', 'hook-handlers', 'eslint-plugin'],
  ],
} as const;
