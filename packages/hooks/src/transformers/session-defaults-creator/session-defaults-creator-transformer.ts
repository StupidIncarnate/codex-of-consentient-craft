/**
 * PURPOSE: Builds the root-level Claude Code session settings `dungeonmaster init` writes into
 * `.claude/settings.json` — the prompt-cache windows, the inbound peer-message stance, and the
 * default sub-agent model. Reach for this over `dungeonmasterHooksCreatorTransformer` when the
 * value belongs at the settings ROOT rather than under `hooks`.
 *
 * USAGE:
 * sessionDefaultsCreatorTransformer();
 * // Returns {crossSessionInbound, promptCacheTtl, subagentPromptCacheTtl, env} ready to spread
 *
 * It takes no existing settings and decides nothing about them. Whether a value already on disk
 * survives is the caller's spread order: `InstallCreateSettingsResponder` spreads this block
 * BEFORE the consumer's own settings so anything they set wins outright, and merges `env` key by
 * key so their own variables survive alongside the one added here. That split is deliberate — the
 * responder reads settings.json with a cast rather than a parse, so re-validating a consumer's
 * values here would turn a hand-written typo anywhere in their file into a crashed `init`.
 */

import { agentSessionDefaultsStatics } from '@dungeonmaster/shared/statics';
import { claudeSettingsContract } from '../../contracts/claude-settings/claude-settings-contract';
import type { ClaudeSettings } from '../../contracts/claude-settings/claude-settings-contract';

export const sessionDefaultsCreatorTransformer = (): ClaudeSettings =>
  claudeSettingsContract.parse({
    crossSessionInbound: agentSessionDefaultsStatics.settings.crossSessionInbound,
    promptCacheTtl: agentSessionDefaultsStatics.settings.promptCacheTtl,
    subagentPromptCacheTtl: agentSessionDefaultsStatics.settings.subagentPromptCacheTtl,
    env: agentSessionDefaultsStatics.env,
  });
