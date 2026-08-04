/**
 * PURPOSE: Shared "Operating Rules" blocks embedded at the top of every file-changing worker prompt — the turn-discipline, ward-scope, and environment-wall rules that stop a sub-agent from stranding its work item, wedging the quest, or burning its pt-chain budget on a wall no session of its role can pass
 *
 * USAGE:
 * agentOperatingRulesStatics.markdown;
 * // Returns the Operating Rules block for a role that OWNS a work item (codeweaver, flowrider, siegemaster, blightwarden, spiritmender, pesteater)
 * agentOperatingRulesStatics.minionMarkdown;
 * // Returns the Operating Rules block for a parent-summoned minion, which owns no work item
 *
 * Two variants, because the terminal action differs and the difference is load-bearing. A work-item
 * role ENDS in `signal-back`; a minion must NEVER call it — the `workItemId` in a minion's briefing
 * is its PARENT's, so signalling on it would complete the parent's operation item and advance the
 * relay while the parent is still working. A single shared block cannot say both: whichever mandate
 * it carries contradicts the role text of the other family, and a prompt that contradicts itself is
 * resolved by whichever instruction the agent reads first.
 *
 * Rules 2-4 are turn discipline and ward scope — identical for both, so they are composed from one
 * source here rather than copy-pasted into each variant.
 */

const heading = `## Operating Rules — READ FIRST (ignoring these wedges the whole quest)`;

const backgroundTaskRule = `**2. NEVER end your turn waiting for a background task, and NEVER poll for one.** Run commands in the foreground and let them finish before you continue. A sub-agent does NOT receive an async wakeup when a detached background task finishes — end your turn waiting on one and your work item hangs forever. The remedy is to keep every command short enough to finish in the foreground (scope your ward — Rule 3 — so it never trips auto-backgrounding); a whole-repo command that the harness auto-backgrounds is a sign you ran the wrong (too-broad) command, not something to wait on. If a command does background, do NOT try to "wait it out": no \`sleep N && tail\`, no \`while pgrep …; do sleep; done\`, no re-reading the partial output file in a loop. (A \`pgrep -f "<term>"\` poll loop also matches its OWN command line — \`<term>\` is in the loop's argv — so it never exits and burns the entire timeout.) Re-running the same broad command does NOT help — it just backgrounds again; scope it down and re-run scoped instead. This applies with full force to ward: a minion or sub-agent that kicks off a broad \`npm run ward\` (whole-repo OR a bare \`-- packages/<pkg>\` directory) will watch it get auto-backgrounded and then hang forever awaiting a completion notification that never arrives — keep ward FILE-scoped (Rule 3) so it finishes in the foreground. (CLAUDE.md ward rules: pick ONE mode, never the foreground/background hybrid.)`;

const wardScopeRule = `**3. Run ward SCOPED to what you changed, ALWAYS in the foreground. NEVER run the whole-repo \`npm run ward\`.** Always \`npm run ward -- --only <checks> -- <paths>\` with \`timeout: 600000\`, scoped to the files you touched — it stays in the foreground and finishes fast. Those \`<paths>\` MUST be explicit FILE paths (\`-- <file1> <file2>\`), NEVER a bare directory (\`-- packages/<pkg>\`): a directory scope pulls in the whole package, runs for minutes, and the harness auto-backgrounds it exactly like the whole-repo command — which strands your turn (see Rule 2). A bare whole-repo \`npm run ward\` runs for minutes and the harness auto-backgrounds it, which strands your turn (see Rule 2) — so never run it. The full-repo regression sweep is the dispatcher's own \`run-ward\` work item that runs after you; your job is only to prove the files YOU changed are green.`;

const synchronousAgentRule = `**4. The \`Agent\`/Task tool is SYNCHRONOUS — awaiting a helper you spawn is allowed and does NOT violate Rule 2.** Rule 2 forbids ending your turn waiting on a backgrounded *shell* command. A sub-agent you spawn via \`Agent\` returns its result inline as the tool result within the same turn — you stay alive, read what it returns, and continue. If your role's prompt tells you to delegate isolated work to a helper, decide it EARLY (the model will not reliably stop to delegate deep into a long turn), brief the helper fully, and block on its result.`;

const deniedCommandWall = `You are dispatched with no interactive approver: a command outside the project's permission allowlist comes back \`This command requires approval\` and is DENIED outright, not queued for someone to accept. The same goes for a missing credential, an unreachable service, or a tool the sandbox does not expose.`;

export const agentOperatingRulesStatics = {
  markdown: `${heading}

You are a Task-dispatched sub-agent. These rules are non-negotiable for every file-changing role — breaking any one of them strands your work item and wedges the whole quest behind you.

**1. ALWAYS call \`signal-back\` as the final action of your turn.** You are NOT re-invoked when a background task finishes — that deferred-wakeup model belongs to the top-level session, not a sub-agent. If you end your turn with a plain text message and no \`signal-back\`, your turn ends, your work item stays \`in_progress\` forever, downstream roles never dispatch, and there is no auto-retry. Every path through this prompt — success or failure — ends in exactly one \`signal-back(...)\` call (your role's terminal signal).

${backgroundTaskRule}

${wardScopeRule}

${synchronousAgentRule}

**5. When the wall is the ENVIRONMENT, not the work, signal \`operationStatus: 'blocked'\` — never \`partial\`.** ${deniedCommandWall} Retrying it, rephrasing it, or handing it to a fresh session of your role cannot work — every one of them hits the identical wall.

\`partial\` means *scope remains that another session of my role can pick up*; it costs a pt-chain attempt and spawns exactly the successor that will fail the same way. \`blocked\` means *no session of my role can proceed until a human changes something*: it halts the quest immediately, surfaces your reason to the user, and re-queues your operation item so a resume picks up right here. Include a \`blockedReason\` that names the wall AND what the user must change:

\`\`\`
signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'blocked', blockedReason: 'git commit is denied in this dispatched session (no approver); add Bash(git commit:*) to .claude/settings.json permissions.allow' })
\`\`\`

Commit whatever you finished first, exactly as you would for \`partial\` — a blocked quest still hands its work forward through git.`,

  minionMarkdown: `${heading}

You are a parent-summoned minion running as a sub-agent. These rules are non-negotiable for every file-changing minion — breaking any one of them strands the parent that is blocked waiting on you, and wedges the whole quest behind it.

**1. NEVER call \`signal-back\` — your final message IS your terminal action.** You have no work item of your own. The \`workItemId\` in your briefing belongs to your PARENT: signalling on it would complete the parent's operation item and advance the relay while the parent is still working. Every path through this prompt — a clean pass, or a wall you cannot get past — ends by returning your distilled artifact as your final message. The parent is blocked on that message: it reads it, verifies it, wards the batch, and signals for you.

${backgroundTaskRule}

${wardScopeRule}

${synchronousAgentRule}

**5. When the wall is the ENVIRONMENT, not the work, report it — do not work around it.** ${deniedCommandWall} Retrying it or rephrasing it cannot work, and neither can any sibling minion. Name the wall and what a human must change under \`UNFIXABLE\` in your return; the parent decides whether that becomes an \`operationStatus: 'blocked'\` for the whole quest. Do NOT paper over it, and do NOT report a green ward you did not actually get.`,
} as const;
