/**
 * PURPOSE: The Bash permissions `dungeonmaster init` grants in `.claude/settings.json` so a
 * manual-QA session can drive a running system at its real surface and read values back off it.
 *
 * USAGE:
 * agentQaPermissionsStatics.allow;
 * // Returns ['Bash(curl:*)', 'Bash(kill:*)', …] — the settings.json allow entries
 *
 * A dispatched agent has no interactive approver: a command outside `permissions.allow` comes back
 * `This command requires approval` and is DENIED outright, never prompted. `curl` is not a
 * convenience here, it is the instrument the `manual-qa` discipline pack names twice and has no
 * substitute for:
 *
 * - Not every flow has a UI. A CLI path, a queue consumer or a server-only route is walked at its
 *   REAL surface, and for an HTTP route that surface is the status line and the response body — a
 *   value read off the running system, which is what that discipline means by verification.
 * - This repo's dev server binds IPv6-only, so Node's `fetch` fails against it where `curl`
 *   succeeds. The pack documents that as durable environment knowledge and prescribes
 *   `curl -sf --retry 15 --retry-delay 2 --retry-connrefused` as the readiness poll, because the
 *   Bash static analyzer rejects a hand-rolled shell loop. Denying `curl` walls BOTH the
 *   instrument and the documented way around the wall, and leaves the worker's own prompt with no
 *   third option written down.
 *
 * It is a READ of a local surface the session already owns — the dev server its own operator
 * started — so it carries none of the reach that keeps `stash` / `reset` / `rebase` denied in
 * `agentGitPermissionsStatics`.
 *
 * `kill` / `lsof` / `ps` are the PROCESS half of the same job, and two verification surfaces are
 * defined in terms of them: `qaOffMapProbeStatics.byFamily.interruption` is "kill the process
 * mid-action", and `qaCheckSurfaceStatics.byOutcomeType['process-state']` is "the real OS process —
 * that it is running or absent, its argv, or its exit code". Both are units in Siegemaster's own
 * denominator, so a denial does not halt anything: it quietly turns every one of them into an
 * `unconfirmable`, which is the deferral-behind-a-responsible-verdict the reviewer blocks exist to
 * reopen. `pkill` stays out deliberately — the manual-qa pack forbids a bare-name kill BY NAME,
 * because it reaps processes the session did not start, and a grant would undercut that sentence.
 *
 * `python3` is here because the manual-qa pack offers `.js`/`.py` throwaway drivers as a matched
 * pair, twice. `Bash(node:*)` covers the first; without this the choice between them is a coin
 * flip on whether the worker's driver runs at all.
 *
 * The dev server needs no entry in THIS repo: it is started and torn down through `npm run dev` and
 * `npm run dev:kill`, which `Bash(npm run:*)` covers. That is a property of an npm-scripted repo,
 * not of the product — `devServer.devCommand` comes from the user's own `.dungeonmaster.json` and
 * may be anything, so an end-user repo whose command is not an npm script needs its own grant.
 */

export const agentQaPermissionsStatics = {
  allow: ['Bash(curl:*)', 'Bash(kill:*)', 'Bash(lsof:*)', 'Bash(ps:*)', 'Bash(python3:*)'],
} as const;
