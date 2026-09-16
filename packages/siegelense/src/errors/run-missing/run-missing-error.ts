/**
 * PURPOSE: Represents an error when a KNOWN instance carries no stored return for a named run —
 * `runs/run_N.json` never landed, because that run never completed or its evidence was pruned.
 * Named apart from `InstanceUnknownError` so a caller can tell "the instance never existed" from
 * "the instance exists but this one run has no evidence" — `compareReadBroker` throws this only
 * after `instanceStateResolveBroker` has already confirmed the instance itself is real.
 *
 * USAGE:
 * throw new RunMissingError({ instanceId: 'inst_7f3a9c21', runId: 'run_9' });
 * // Throws error naming the instance and the run with no stored return
 *
 * WHEN-TO-USE: Once a stored-return read against a run of a KNOWN instance comes back ENOENT, so a
 * caller can `instanceof`-check it apart from every other read failure (permissions, disk errors) and
 * apart from `InstanceUnknownError`.
 * WHEN-NOT-TO-USE: When the instance id itself has no registry row — `InstanceUnknownError` covers
 * that case, thrown before any run is ever read.
 */
export class RunMissingError extends Error {
  public constructor({ instanceId, runId }: { instanceId: string; runId: string }) {
    super(
      `No stored return for run "${runId}" on instance "${instanceId}" — that run never completed, or its evidence was pruned.`,
    );
    this.name = 'RunMissingError';
  }
}
