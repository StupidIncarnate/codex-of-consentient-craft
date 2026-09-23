/**
 * PURPOSE: Thrown when `laneWorkspaceResolveBroker` finds MORE THAN ONE `packages/*` directory whose
 * detected `packageType` matches the one a lane process template needs — two packages answering the
 * same role is exactly the ambiguity `no-hardcoded-package-names` exists to force a caller to handle,
 * rather than silently taking the first match and booting the wrong one. Reach for this ONLY from
 * that broker. Fields are stored as `unknown`: `errors/` imports nothing, so it cannot brand them
 * through `absoluteFilePathContract`/`packageTypeContract`/`packageNameContract` — the caller already
 * validated all three before this throws.
 *
 * USAGE:
 * throw new LaneWorkspaceSeveralMatchedError({
 *   repoRoot: '/repo',
 *   packageType: 'http-backend',
 *   matches: ['@scope/api', '@scope/gateway'],
 * });
 * // Throws naming every package that answered the kind
 */
export class LaneWorkspaceSeveralMatchedError extends Error {
  public readonly repoRoot: unknown;

  public readonly packageType: unknown;

  public readonly matches: readonly unknown[];

  public constructor({
    repoRoot,
    packageType,
    matches,
  }: {
    repoRoot: unknown;
    packageType: unknown;
    matches: readonly unknown[];
  }) {
    super(
      `${String(matches.length)} packages under "${String(repoRoot)}/packages" detected as packageType ` +
        `"${String(packageType)}": ${matches.map(String).join(', ')}. A lane spec's "--workspace=<name>" ` +
        `needs exactly one — narrow the repo, or give the spec its own explicit workspace name instead ` +
        `of this token.`,
    );
    this.repoRoot = repoRoot;
    this.packageType = packageType;
    this.matches = matches;
    this.name = 'LaneWorkspaceSeveralMatchedError';
  }
}
