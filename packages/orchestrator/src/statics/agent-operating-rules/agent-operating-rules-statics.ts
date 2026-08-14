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

const backgroundTaskRule = `**2. NEVER end your turn waiting for a background task, and NEVER poll for one.** A sub-agent does NOT receive an async wakeup when a detached background task finishes — end your turn waiting on one and your work item hangs forever. Keep every command short enough to finish in the foreground: one the harness auto-backgrounds is a sign you ran the wrong (too-broad) one, so scope it down and re-run scoped. Ward is the usual offender: a minion or sub-agent that kicks off a broad \`npm run ward\` (whole-repo OR a bare \`-- packages/<pkg>\` directory) will watch it get auto-backgrounded and then hang forever awaiting a completion notification that never arrives — keep ward FILE-scoped (Rule 3).`;

const wardScopeRule = `**3. Run ward SCOPED to what you changed, ALWAYS in the foreground. NEVER run the whole-repo \`npm run ward\`.** This rule OVERRIDES the \`<dungeonmaster-ward>\` snippet you were handed at session start: its "make it fully green" line is written for an agent working directly for the user, and you are not one. The full-repo regression sweep is the dispatcher's own \`run-ward\` work item that runs after you; your job is only to prove the files YOU changed are green. Use \`npm run ward -- --only <checks> -- <paths>\`; the build-first, one-mode and run-once mechanics in the \`<dungeonmaster-ward-discipline>\` snippet apply to you unchanged. Those \`<paths>\` MUST be explicit FILE paths (\`-- <file1> <file2>\`), NEVER a bare directory (\`-- packages/<pkg>\`): a directory scope pulls in the whole package and the harness auto-backgrounds it exactly like the whole-repo command, which strands your turn (see Rule 2).`;

const synchronousAgentRule = `**4. The \`Agent\`/Task tool is SYNCHRONOUS — awaiting a helper you spawn is allowed and does NOT violate Rule 2.** Rule 2 forbids ending your turn waiting on a backgrounded *shell* command. A sub-agent you spawn via \`Agent\` returns its result inline as the tool result within the same turn — you stay alive, read what it returns, and continue. If your role's prompt tells you to delegate isolated work to a helper, decide it EARLY (the model will not reliably stop to delegate deep into a long turn) and brief the helper fully. Then simply wait: the helper's result arrives as your next tool result, and waiting for it costs you nothing, because your turn never ended.`;

const deniedCommandWall = `You are dispatched with no interactive approver: a command outside the project's permission allowlist comes back \`This command requires approval\` and is DENIED outright, not queued for someone to accept. The same goes for a missing credential, an unreachable service, or a tool the sandbox does not expose.`;

export const agentOperatingRulesStatics = {
  markdown: `${heading}

You are a Task-dispatched sub-agent. These rules are non-negotiable for every file-changing role — breaking any one of them strands your work item and wedges the whole quest behind you.

**1. ALWAYS call \`signal-back\` as the final action of your turn.** If you end your turn with a plain text message and no \`signal-back\`, your work item stays \`in_progress\` forever, downstream roles never dispatch, and there is no auto-retry. Every path through this prompt — success or failure — ends in exactly one \`signal-back(...)\` call (your role's terminal signal).

${backgroundTaskRule}

${wardScopeRule}

${synchronousAgentRule}

**5. When the wall is the ENVIRONMENT, not the work, signal \`operationStatus: 'blocked'\` — never \`partial\`.** ${deniedCommandWall}

\`partial\` means *scope remains that another session of my role can pick up*; it costs a pt-chain attempt and spawns exactly the successor that will fail the same way. \`blocked\` means *no session of my role can proceed until a human changes something*: it halts the quest immediately, surfaces your reason to the user, and re-queues your operation item so a resume picks up right here. Include a \`blockedReason\` that names the wall AND what the user must change:

\`\`\`
signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'blocked', blockedReason: 'git commit is denied in this dispatched session (no approver); add Bash(git commit:*) to .claude/settings.json permissions.allow' })
\`\`\`

**A wall does not cancel the scope it leaves reachable**, and it marks your work item \`failed\` — a red row, not a clean handoff. Finish and record everything still reachable, THEN pick the status.

**"No session of my role could pass" is a claim about a FRESH session.** Per-session state is not global: each dispatch is its own process with its own MCP child, so a stale server or a module loaded before your fix landed is a wall for THIS session only. A wall a re-dispatch clears is \`partial\`.

Commit whatever you finished first, exactly as you would for \`partial\` — a blocked quest still hands its work forward through git.`,

  minionMarkdown: `${heading}

You are a parent-summoned minion running as a sub-agent. These rules are non-negotiable for every file-changing minion — breaking any one of them strands the parent that is blocked waiting on you, and wedges the whole quest behind it.

**1. NEVER call \`signal-back\` — your final message IS your terminal action.** You have no work item of your own. The \`workItemId\` in your briefing belongs to your PARENT: signalling on it would complete the parent's operation item and advance the relay while the parent is still working. Every path through this prompt — a clean pass, or a wall you cannot get past — ends by returning your distilled artifact as your final message. The parent is blocked on that message: it reads it, verifies it, wards the batch, and signals for you.

${backgroundTaskRule}

${wardScopeRule}

${synchronousAgentRule}

**5. When the wall is the ENVIRONMENT, not the work, report it — do not work around it.** ${deniedCommandWall} Retrying it or rephrasing it cannot work, and neither can any sibling minion. Name the wall and what a human must change under \`UNFIXABLE\` in your return; the parent decides whether that becomes an \`operationStatus: 'blocked'\` for the whole quest. Do NOT paper over it, and do NOT report a green ward you did not actually get.`,
} as const;
