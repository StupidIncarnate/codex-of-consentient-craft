/**
 * PURPOSE: Represents an error when `results` is called against a finished instance with no
 * `run` named and no `since: 'boot'` — that instance may hold the prelude's proving run, the walk
 * and a re-walk, and "latest" would silently read whichever went last (siegelense-tooling.md line
 * 2235). The message names the state and the RUN COUNT, never the run ids themselves
 * (siegelense-tooling.md §3.C: "a count is already what `status { instance }` gives it… but
 * enumerating ids in an error message is a list a session reads instead of reading its own
 * record"), and points the caller at `dungeonmaster siegelense status --instance <id>` rather
 * than listing anything.
 *
 * USAGE:
 * throw new RunIdRequiredError({ instanceId: 'inst_7f3a9c21', instanceState: 'killed', runCount: 2 });
 * // Throws error naming the state and the run count, and pointing at
 * // `dungeonmaster siegelense status --instance <id>` — never a run id
 *
 * WHEN-TO-USE: From the broker resolving a `results` query, once `instanceStateResolveBroker`
 * reports a non-`alive` state and the query carries no `runId` and no `since: 'boot'`, so a caller
 * can `instanceof`-check it to distinguish this refusal from every other `results` failure.
 * WHEN-NOT-TO-USE: When the instance is `alive` (latest is well-defined), or the query already
 * names a `runId`, or the query passes `since: 'boot'` — every one of those resolves without
 * throwing.
 */
export class RunIdRequiredError extends Error {
  public constructor({
    instanceId,
    instanceState,
    runCount,
  }: {
    instanceId: string;
    instanceState: string;
    runCount: number;
  }) {
    super(
      `Instance ${instanceId} is ${instanceState} with ${runCount} run(s) recorded; "latest" cannot ` +
        `be guessed. Name a run with --run <runId>, or pass --since boot for the whole timeline. ` +
        `See dungeonmaster siegelense status --instance ${instanceId} for the run count.`,
    );
    this.name = 'RunIdRequiredError';
  }
}
