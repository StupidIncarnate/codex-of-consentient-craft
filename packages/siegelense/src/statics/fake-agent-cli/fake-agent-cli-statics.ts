/**
 * PURPOSE: The caller-supplied environment variables `lane-boot-broker` checks for before booting
 * a spec whose `requiresFakeAgentCli` is true — `CLAUDE_CLI_PATH` and `WARD_CLI_PATH`, the two
 * tokens `lane-spec-statics.ts` used to carry as unresolvable `{fakeClaudeCliPath}`-style
 * placeholders and now omits entirely, because the real fixture binaries they would need to name
 * live under `packages/web/test/**` and `packages/orchestrator/test-fixtures/**` — neither shipped
 * in this package's published `dist/`, nor a path this package can honestly resolve. Without one of
 * these set, the api process a spec spawns talks to the REAL `claude`/`dungeonmaster-ward`
 * binaries: real API spend, and a non-deterministic reading (siegelense-tooling.md Part 5 — "where
 * a value varies for a reason nothing in the walk caused, the difference reads as a defect"). `hint`
 * is folded into `FakeAgentCliRequiredError`'s message, which imports nothing of its own.
 *
 * USAGE:
 * fakeAgentCliStatics.requiredEnvVars[0].name;
 * // Returns 'CLAUDE_CLI_PATH'
 */

export const fakeAgentCliStatics = {
  requiredEnvVars: [
    { name: 'CLAUDE_CLI_PATH', hint: 'a stub Claude CLI binary' },
    { name: 'WARD_CLI_PATH', hint: 'a stub dungeonmaster-ward CLI binary' },
  ],
} as const;
