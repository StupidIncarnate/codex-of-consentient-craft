/**
 * PURPOSE: Thrown when `laneWorkspaceResolveBroker` finds no `packages/*` directory whose detected
 * `packageType` matches the one a lane process template needs — the SET this repo's own
 * `packages/server`/`packages/web` answer today has zero members in a consumer repo that never
 * built one, or that names its backend/frontend package something a signal this detector does not
 * read. Reach for this ONLY from that broker. `repoRoot`/`packageType` are stored as `unknown`:
 * `errors/` imports nothing, so it cannot brand them through `absoluteFilePathContract`/
 * `packageTypeContract` — the caller already validated both before this throws.
 *
 * USAGE:
 * throw new LaneWorkspaceNoneMatchedError({ repoRoot: '/repo', packageType: 'http-backend' });
 * // Throws naming the repo root and the kind nothing under packages/* answered to
 */
export class LaneWorkspaceNoneMatchedError extends Error {
  public readonly repoRoot: unknown;

  public readonly packageType: unknown;

  public constructor({ repoRoot, packageType }: { repoRoot: unknown; packageType: unknown }) {
    super(
      `No package under "${String(repoRoot)}/packages" detected as packageType "${String(packageType)}". ` +
        `A lane spec's "--workspace=<name>" needs exactly one such package to resolve the token against ` +
        `— add one, or point the spec at a repo that has one.`,
    );
    this.repoRoot = repoRoot;
    this.packageType = packageType;
    this.name = 'LaneWorkspaceNoneMatchedError';
  }
}
