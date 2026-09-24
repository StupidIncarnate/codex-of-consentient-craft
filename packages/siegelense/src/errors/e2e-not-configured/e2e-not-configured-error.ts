/**
 * PURPOSE: Represents a consumer repo with no working e2e lane configured — `devServer.e2e` is
 * absent from `.dungeonmaster.json`, or every configured process still carries the literal
 * placeholder `InstallCreateConfigResponder` seeds. Names the exact config field to edit rather than
 * letting a spawn fail with a bare "command not found", which points at npm rather than at the field
 * that needs editing.
 *
 * USAGE:
 * throw new E2eNotConfiguredError({ specName: 'api' });
 * // Throws naming devServer.e2e.processes in .dungeonmaster.json and what to put there
 *
 * WHEN-TO-USE: From the lane-spec derive broker, once a repo's resolved config carries no
 * `devServer.e2e.processes`, or every configured process still equals the seeded placeholder.
 * WHEN-NOT-TO-USE: When at least one configured process differs from the placeholder — that repo has
 * opted in, and boot proceeds.
 */
export class E2eNotConfiguredError extends Error {
  public constructor({ specName }: { specName: string }) {
    super(
      `siegelense has no e2e lane configured for spec "${specName}": add devServer.e2e.processes ` +
        "to .dungeonmaster.json, naming the no-watch command(s) that boot this repo's own app — " +
        'the same way this repo\'s own Playwright e2e setup boots it. "dungeonmaster init" seeds a ' +
        'placeholder entry; edit devServer.e2e.processes[0].command (and portRole/readyPath) to point ' +
        "at this repo's real no-watch dev command before running a lane.",
    );
    this.name = 'E2eNotConfiguredError';
  }
}
