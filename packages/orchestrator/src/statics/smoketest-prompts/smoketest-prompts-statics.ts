/**
 * PURPOSE: Canned prompt bank for smoketest scenarios — signal prompts (complete/failed/failed-replan), a dynamically-generated probe prompt per MCP tool from `mcpToolsStatics.tools.names`, and a dev-server verification prompt
 *
 * USAGE:
 * smoketestPromptsStatics.signalComplete;
 * // Returns: the signal-complete prompt string
 * smoketestPromptsStatics.discover;
 * // Returns: the probe prompt for mcp__dungeonmaster__discover
 *
 * DYNAMIC GENERATION: Probe prompts are keyed by MCP tool name and synthesized by looping
 * `mcpToolsStatics.tools.names` × `smoketestProbeArgsStatics`. Adding or removing a tool in
 * `mcpToolsStatics.tools.names` auto-extends/shrinks the probe prompt bank — the only other change
 * required is adding the matching entry in `smoketestProbeArgsStatics` (pinned by a colocated test).
 *
 * PLACEHOLDERS: Some probe args contain literal `{{questId}}` / `{{guildId}}` strings. These are
 * substituted with the live smoketest quest's id and guild id at enqueue time
 * (`enqueue-bundled-suite-layer-responder`). Probes flagged with `expectError: true` use a hard-coded
 * placeholder id and the prompt explicitly tells the agent the tool call is expected to error so the
 * harness still passes once `signal-back complete` fires.
 *
 * NO ToolSearch preamble: smoketest agents spawn via `claude --print` (headless) which pre-loads every
 * MCP tool configured in `.mcp.json` directly into the tool list. `ToolSearch` is an interactive
 * Claude-Code-only feature and does not exist in `-p` mode; including it caused Haiku to derail while
 * looking for a tool that isn't there. MCP tools are callable by their fully-qualified names
 * (`mcp__dungeonmaster__<tool>`) from the first turn.
 */

import { mcpToolsStatics } from '@dungeonmaster/shared/statics';

import { smoketestProbeArgsStatics } from '../smoketest-probe-args/smoketest-probe-args-statics';

const SERVER = mcpToolsStatics.server.name;
const SIGNAL = `mcp__${SERVER}__signal-back`;

const probePromptEntries = mcpToolsStatics.tools.names.map((toolName) => {
  const spec = smoketestProbeArgsStatics[toolName];
  if (spec.mode === 'skip-call') {
    const prompt = `Do exactly one thing and nothing else: Call "${SIGNAL}" with { "signal": "complete", "summary": "${spec.summary}" }. ${spec.note}`;
    return [toolName, prompt] as const;
  }
  if (spec.mode === 'signal-only') {
    const prompt = `Do exactly one thing and nothing else: Call "${SIGNAL}" with { "signal": "complete", "summary": "${spec.summary}" }. Do not output anything else.`;
    return [toolName, prompt] as const;
  }
  const fullToolName = `mcp__${SERVER}__${toolName}`;
  const argsJson = JSON.stringify(spec.args);
  const expectErrorNote =
    'expectError' in spec
      ? ` The tool call is expected to error with a "not found" message because the placeholder id is not a real running record — that error is fine. Still call signal-back complete after.`
      : '';
  const prompt = `Do exactly two things and nothing else: 1) Call "${fullToolName}" with ${argsJson}.${expectErrorNote} 2) Call "${SIGNAL}" with { "signal": "complete", "summary": "${spec.summary}" }. Do not output anything else.`;
  return [toolName, prompt] as const;
});

const probePrompts = Object.fromEntries(probePromptEntries);

export const smoketestPromptsStatics = {
  signalComplete: `Do exactly one thing and nothing else: Call "${SIGNAL}" with { "signal": "complete", "summary": "smoketest-complete" }. Do not output anything else.`,
  signalFailed: `Do exactly one thing and nothing else: Call "${SIGNAL}" with { "signal": "failed", "summary": "smoketest-failed" }. Do not output anything else.`,
  signalFailedReplan: `Do exactly one thing and nothing else: Call "${SIGNAL}" with { "signal": "failed-replan", "summary": "smoketest-failed-replan" }. Do not output anything else.`,

  ...probePrompts,

  siegeVerifyDevServer: `Do exactly two things and nothing else: 1) fetch GET http://dungeonmaster.localhost:4751/ and verify it returns 200. 2) Call "${SIGNAL}" with { "signal": "complete", "summary": "dev-server-verified" }. Do not output anything else.`,
} as const;

export type SmoketestPromptName = keyof typeof smoketestPromptsStatics;
