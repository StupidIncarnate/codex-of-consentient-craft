/**
 * PURPOSE: Canned prompt bank for smoketest scenarios — signal prompts (complete + the two operation outcomes done/partial), a dynamically-generated probe prompt per MCP tool from `mcpToolsStatics.tools.names`, and a dev-server verification prompt
 *
 * USAGE:
 * smoketestPromptsStatics.signalComplete;
 * // Returns: the signal-complete prompt string
 * smoketestPromptsStatics.signalDone;
 * // Returns: the signal-back complete + operationStatus:done prompt string
 * smoketestPromptsStatics.discover;
 * // Returns: the probe prompt for mcp__dungeonmaster__discover
 *
 * DYNAMIC GENERATION: Probe prompts are keyed by MCP tool name and synthesized by looping
 * `mcpToolsStatics.tools.names` × `smoketestProbeArgsStatics`. Adding or removing a tool in
 * `mcpToolsStatics.tools.names` auto-extends/shrinks the probe prompt bank — the only other change
 * required is adding the matching entry in `smoketestProbeArgsStatics` (pinned by a colocated test).
 * Tools flagged with `mode: 'skip-from-suite'` are filtered out and produce no probe prompt —
 * exercising them is the orchestration suite's job.
 *
 * PLACEHOLDERS: Some probe args contain literal `{{questId}}` / `{{guildId}}` / `{{processId}}`
 * strings. These are substituted with live ids at enqueue time
 * (`enqueue-bundled-suite-layer-responder`). With every placeholder resolved, the probe is expected
 * to succeed; a tool-call error means a real regression (permission gap, contract drift, broken
 * handler). There is no failure signal in the relay model, so on a tool-call error the probe reports
 * the error and stops WITHOUT signaling — leaving its work item non-terminal instead of masking the
 * error as `complete`.
 *
 * NO ToolSearch preamble: smoketest agents spawn via `claude --print` (headless) which pre-loads every
 * MCP tool configured in `.mcp.json` directly into the tool list. `ToolSearch` is an interactive
 * Claude-Code-only feature and does not exist in `-p` mode; including it caused Haiku to derail while
 * looking for a tool that isn't there. MCP tools are callable by their fully-qualified names
 * (`mcp__dungeonmaster__<tool>`) from the first turn.
 */

import { mcpToolsStatics } from '@dungeonmaster/shared/statics';

import { smoketestPlaceholdersStatics } from '../smoketest-placeholders/smoketest-placeholders-statics';
import { smoketestProbeArgsStatics } from '../smoketest-probe-args/smoketest-probe-args-statics';

const SERVER = mcpToolsStatics.server.name;
const SIGNAL = `mcp__${SERVER}__signal-back`;

// `signal-back` REQUIRES questId + workItemId. A scripted agent's whole context is its one-line
// prompt — it never calls `get-agent-prompt`, which is the only thing that would otherwise tell it
// which work item it is — so a call omitting them is rejected by the tool and the agent has nothing
// to recover from. Every canned prompt below therefore carries the placeholders, resolved to live
// ids at stamp/enqueue time. Without this the whole relay stalls on the first agent, orphan recovery
// spends its three resets re-dispatching a session that cannot possibly signal, and the quest blocks.
const SIGNAL_IDS = `"questId": "${smoketestPlaceholdersStatics.questId}", "workItemId": "${smoketestPlaceholdersStatics.workItemId}"`;

const probePromptEntries = mcpToolsStatics.tools.names.flatMap((toolName) => {
  const spec = smoketestProbeArgsStatics[toolName];
  if (spec.mode === 'skip-from-suite') {
    return [];
  }
  if (spec.mode === 'signal-only') {
    const prompt = `Do exactly one thing and nothing else: Call "${SIGNAL}" with { ${SIGNAL_IDS}, "signal": "complete", "summary": "${spec.summary}" }. Do not output anything else.`;
    return [[toolName, prompt] as const];
  }
  const fullToolName = `mcp__${SERVER}__${toolName}`;
  const argsJson = JSON.stringify(spec.args);
  const prompt = `Do exactly two things and nothing else: 1) Call "${fullToolName}" with ${argsJson}. 2) If the tool call errors, report the error and stop without signaling. If the tool call succeeds, call "${SIGNAL}" with { ${SIGNAL_IDS}, "signal": "complete", "summary": "${spec.summary}" }. Do not output anything else.`;
  return [[toolName, prompt] as const];
});

const probePrompts = Object.fromEntries(probePromptEntries);

export const smoketestPromptsStatics = {
  signalComplete: `Do exactly one thing and nothing else: Call "${SIGNAL}" with { ${SIGNAL_IDS}, "signal": "complete", "summary": "smoketest-complete" }. Do not output anything else.`,
  signalDone: `Do exactly one thing and nothing else: Call "${SIGNAL}" with { ${SIGNAL_IDS}, "signal": "complete", "operationStatus": "done" }. Do not output anything else.`,
  signalPartial: `Do exactly one thing and nothing else: Call "${SIGNAL}" with { ${SIGNAL_IDS}, "signal": "complete", "operationStatus": "partial" }. Do not output anything else.`,

  ...probePrompts,

  siegeVerifyDevServer: `Do exactly two things and nothing else: 1) fetch GET http://dungeonmaster.localhost:4751/ and verify it returns 200. 2) Call "${SIGNAL}" with { ${SIGNAL_IDS}, "signal": "complete", "summary": "dev-server-verified" }. Do not output anything else.`,
} as const;

export type SmoketestPromptName = keyof typeof smoketestPromptsStatics;
