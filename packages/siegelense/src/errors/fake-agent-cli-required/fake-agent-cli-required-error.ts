/**
 * PURPOSE: Represents a lane spec's `requiresFakeAgentCli` declaration meeting an environment that
 * supplies none of the variables it names — booting would spawn the spec's api process against the
 * REAL `claude`/`dungeonmaster-ward` binaries instead of a stub: real API spend, and a
 * non-deterministic reading no comparison in this design can trust (see
 * `fake-agent-cli-statics.ts`'s header). Every missing variable is folded into one message, with
 * what to set it to, rather than one throw per variable, so a caller fixing this sees the whole
 * list on the first refusal.
 *
 * USAGE:
 * throw new FakeAgentCliRequiredError({
 *   specName: 'dungeonmaster-api',
 *   missing: [{ name: 'CLAUDE_CLI_PATH', hint: 'a stub Claude CLI binary' }],
 * });
 * // Throws error naming the spec and, for each missing variable, what to set it to
 *
 * WHEN-TO-USE: From the boot broker, before spawning anything, once a spec declaring
 * `requiresFakeAgentCli: true` finds one or more of `fakeAgentCliStatics.requiredEnvVars` absent
 * from the environment it inherited.
 * WHEN-NOT-TO-USE: When the spec does not declare `requiresFakeAgentCli`, or every required
 * variable is already present — boot proceeds and never throws.
 */
export class FakeAgentCliRequiredError extends Error {
  public constructor({
    specName,
    missing,
  }: {
    specName: string;
    missing: readonly { name: string; hint: string }[];
  }) {
    super(
      `Lane spec ${specName} requires a fake agent CLI, and the environment supplies none of it: ` +
        `${missing.map(({ name, hint }) => `set ${name} to ${hint}`).join('; ')}. Refusing to boot ` +
        `against the real CLI — that spends real API usage and produces a non-deterministic reading.`,
    );
    this.name = 'FakeAgentCliRequiredError';
  }
}
