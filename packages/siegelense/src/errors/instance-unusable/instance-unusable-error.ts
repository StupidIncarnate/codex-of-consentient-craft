/**
 * PURPOSE: Represents an error when `run` is asked to dispatch another batch of steps against an
 * instance whose registry row already reads `unusable` — a `seed` step failed mid-batch on an
 * earlier run, so the app now holds a partially-seeded world with nothing to roll back to
 * (scrolls/seigelense/siegelense-recipes.md: "A mid-batch seed that fails HALTS the batch and marks
 * the instance unusable. The walk does not continue... Re-running a failed seed is not safe and the
 * tool should not offer it"). Thrown by `instanceRunBroker` before the request ever reaches the
 * driver socket, so a walk pays no round trip to learn this.
 *
 * USAGE:
 * throw new InstanceUnusableError({ instanceId: 'inst_7f3a9c21' });
 * // Throws error naming the instance and pointing at a fresh `dungeonmaster siegelense start`
 *
 * WHEN-TO-USE: From `instanceRunBroker`, once the registry row it already read for the socket path
 * carries `state: 'unusable'`, so a caller can `instanceof`-check it apart from every other `run`
 * failure.
 * WHEN-NOT-TO-USE: For any other instance state — `alive`, `dead`, `killed`, `pruned` and `unknown`
 * all reach the driver (or their own existing refusal) instead. Read paths (`results`, `status`,
 * `snapshots`, `compare`) never throw this — an unusable instance's evidence is still real and still
 * worth a fixer's look.
 */
export class InstanceUnusableError extends Error {
  public constructor({ instanceId }: { instanceId: string }) {
    super(
      `Instance ${instanceId} is unusable: a seed step failed mid-batch on an earlier run, leaving ` +
        `it partially seeded with nothing to roll back to. Continuing to drive it would turn that ` +
        `one failure into a round's worth of wrong findings — start a fresh instance with ` +
        `dungeonmaster siegelense start instead.`,
    );
    this.name = 'InstanceUnusableError';
  }
}
