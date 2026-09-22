/**
 * PURPOSE: The session-wide Claude Code settings `dungeonmaster init` writes at the ROOT of
 * `.claude/settings.json`, so an orchestrator and the sub-agents it dispatches keep a warm prompt
 * cache and a cheap default model. Reach for this over `agentGitPermissionsStatics` and the other
 * `agent-*-permissions` statics when the value is a session knob rather than a `permissions.allow`
 * entry — nothing here sits inside `permissions`.
 *
 * USAGE:
 * agentSessionDefaultsStatics.settings.subagentPromptCacheTtl;
 * // Returns '1h' — the settings.json root key
 *
 * `subagentPromptCacheTtl: '1h'` is the entry that pays for itself. A cache read refreshes its own
 * entry's timer, so a 5-minute entry stays warm indefinitely while requests keep arriving — but a
 * dispatched sub-agent's prefix sits untouched for as long as its work runs, and orchestrated work
 * routinely runs longer than five minutes. The 1-hour TTL covers exactly that gap, for a cache
 * write billed at 2x the base input rate against the 5-minute TTL's 1.25x. Reads cost the same
 * under either TTL, so the premium is confined to writes.
 *
 * `promptCacheTtl: '1h'` pins the same window for the main conversation, which a Claude
 * subscription inside its usage limits already resolves to 1 hour on its own. Writing it makes the
 * window explicit rather than dependent on which credential the session runs under.
 *
 * `crossSessionInbound: 'refuse'` opts sessions out of peer messages from the user's other
 * sessions. A settings file may only TIGHTEN this key — `refuse` and `hold` are honoured from one,
 * `accept` is not — so a value written here is one the consumer cannot loosen from their own user
 * settings. That asymmetry is why `InstallCreateSettingsResponder` spreads these defaults UNDER a
 * consumer's own settings: every key here lands on a fresh install and yields to whatever they set
 * afterwards.
 *
 * `promptSuggestionEnabled: false` turns off the predicted next prompt the CLI emits after every
 * turn. Generating one costs a request over the conversation on each turn, and an orchestrated
 * session never reads it — what comes next here is a dispatch, not a person choosing a suggestion.
 * The `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION` environment variable trumps this key, so a consumer
 * who wants suggestions back has that lever as well as their own settings value.
 *
 * `CLAUDE_CODE_SUBAGENT_MODEL` has no settings key of its own, so the environment variable rides in
 * the `env` block instead. It sets a DEFAULT: an agent definition's own `model`, or an explicit
 * `model` on a dispatch, still wins over it.
 */

export const agentSessionDefaultsStatics = {
  settings: {
    crossSessionInbound: 'refuse',
    promptCacheTtl: '1h',
    subagentPromptCacheTtl: '1h',
    promptSuggestionEnabled: false,
  },
  env: {
    CLAUDE_CODE_SUBAGENT_MODEL: 'sonnet',
  },
} as const;
