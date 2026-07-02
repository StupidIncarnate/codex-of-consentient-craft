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

**2. NEVER end your turn waiting for a background task, and NEVER poll for one.** Run commands in the foreground and let them finish before you continue. A sub-agent does NOT receive an async wakeup when a detached background task finishes — end your turn waiting on one and your work item hangs forever. The remedy is to keep every command short enough to finish in the foreground (scope your ward — Rule 3 — so it never trips auto-backgrounding); a whole-repo command that the harness auto-backgrounds is a sign you ran the wrong (too-broad) command, not something to wait on. If a command does background, do NOT try to "wait it out": no \`sleep N && tail\`, no \`while pgrep …; do sleep; done\`, no re-reading the partial output file in a loop. (A \`pgrep -f "<term>"\` poll loop also matches its OWN command line — \`<term>\` is in the loop's argv — so it never exits and burns the entire timeout.) Re-running the same broad command does NOT help — it just backgrounds again; scope it down and re-run scoped instead. This applies with full force to ward: a minion or sub-agent that kicks off a broad \`npm run ward\` (whole-repo OR a bare \`-- packages/<pkg>\` directory) will watch it get auto-backgrounded and then hang forever awaiting a completion notification that never arrives — keep ward FILE-scoped (Rule 3) so it finishes in the foreground. (CLAUDE.md ward rules: pick ONE mode, never the foreground/background hybrid.)

**3. Run ward SCOPED to what you changed, ALWAYS in the foreground. NEVER run the whole-repo \`npm run ward\`.** Always \`npm run ward -- --only <checks> -- <paths>\` with \`timeout: 600000\`, scoped to the files you touched — it stays in the foreground and finishes fast. Those \`<paths>\` MUST be explicit FILE paths (\`-- <file1> <file2>\`), NEVER a bare directory (\`-- packages/<pkg>\`): a directory scope pulls in the whole package, runs for minutes, and the harness auto-backgrounds it exactly like the whole-repo command — which strands your turn (see Rule 2). A bare whole-repo \`npm run ward\` runs for minutes and the harness auto-backgrounds it, which strands your turn (see Rule 2) — so never run it. The full-repo regression sweep is the dispatcher's own \`run-ward\` work item that runs after you; your job is only to prove the files YOU changed are green.

**4. The \`Agent\`/Task tool is SYNCHRONOUS — awaiting a helper you spawn is allowed and does NOT violate Rule 2.** Rule 2 forbids ending your turn waiting on a backgrounded *shell* command. A sub-agent you spawn via \`Agent\` returns its result inline as the tool result within the same turn — you stay alive, read what it returns, and continue. If your role's prompt tells you to delegate isolated work to a helper, decide it EARLY (the model will not reliably stop to delegate deep into a long turn), brief the helper fully, and block on its result.`,
} as const;
