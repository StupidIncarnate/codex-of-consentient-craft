/**
 * PURPOSE: Shared "Operating Rules" block embedded at the top of every file-changing worker prompt (codeweaver onward) — the turn-discipline + ward-scope rules that stop a sub-agent from stranding its work item and wedging the quest
 *
 * USAGE:
 * agentOperatingRulesStatics.markdown;
 * // Returns the Operating Rules markdown block, interpolated into each worker prompt template
 */

export const agentOperatingRulesStatics = {
  markdown: `## Operating Rules — READ FIRST (ignoring these wedges the whole quest)

You are a Task-dispatched sub-agent. These rules are non-negotiable for every file-changing role — breaking any one of them strands your work item and wedges the whole quest behind you.

**1. ALWAYS call \`signal-back\` as the final action of your turn.** You are NOT re-invoked when a background task finishes — that deferred-wakeup model belongs to the top-level session, not a sub-agent. If you end your turn with a plain text message and no \`signal-back\`, your turn ends, your work item stays \`in_progress\` forever, downstream roles never dispatch, and there is no auto-retry. Every path through this prompt — success or failure — ends in exactly one \`signal-back(...)\` call (your role's terminal signal).

**2. NEVER end your turn waiting for a background task.** Run commands in the foreground and let them finish before you continue. If the harness auto-backgrounds a long command, do NOT sit and "wait for the completion notification" — a sub-agent never receives it and you will strand the quest. Block on the result immediately (or re-run the command and block on it). Reading a partial output file in a wait-loop is the same anti-pattern — don't. (CLAUDE.md ward rules: pick ONE mode, never the foreground/background hybrid.)

**3. Run ward SCOPED to what you changed, ALWAYS in the foreground.** Default to \`npm run ward -- --only <checks> -- <paths>\` with \`timeout: 600000\` — it stays foreground and finishes fast. Run the whole-repo \`npm run ward\` ONLY when your role's own instructions explicitly require a full regression; when you do, run it foreground-blocking (\`timeout: 600000\`) and NEVER let it background. Otherwise the full-repo sweep is the dispatcher's separate ward work item, not yours.

**4. The \`Agent\`/Task tool is SYNCHRONOUS — awaiting a helper you spawn is allowed and does NOT violate Rule 2.** Rule 2 forbids ending your turn waiting on a backgrounded *shell* command. A sub-agent you spawn via \`Agent\` returns its result inline as the tool result within the same turn — you stay alive, read what it returns, and continue. If your role's prompt tells you to delegate isolated work to a helper, decide it EARLY (the model will not reliably stop to delegate deep into a long turn), brief the helper fully, and block on its result.`,
} as const;
