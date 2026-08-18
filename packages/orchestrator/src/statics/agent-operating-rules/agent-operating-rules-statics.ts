/**
 * PURPOSE: Shared "Operating Rules" blocks embedded at the top of every file-changing worker prompt — the turn-discipline, ward-scope, and environment-wall rules that stop a sub-agent from stranding its work item, wedging the quest, or burning its pt-chain budget on a wall no session of its role can pass
 *
 * USAGE:
 * agentOperatingRulesStatics.markdown;
 * // Returns the Operating Rules block for a work-item role that CHANGES FILES and runs its own ward (spiritmender, warpgate)
 * agentOperatingRulesStatics.operatorMarkdown;
 * // Returns the Operating Rules block for a work-item role that opens no file and runs no ward (the five operator roles)
 * agentOperatingRulesStatics.delegatingMinionMarkdown;
 * // Returns the Operating Rules block for a parent-summoned minion allowed a bounded spike (planner-minion)
 * agentOperatingRulesStatics.leafMinionMarkdown;
 * // Returns the Operating Rules block for a parent-summoned minion that spawns nothing of its own (worker-minion, reviewer-minion, and every other leaf minion)
 *
 * Four variants, on THREE independent axes, and no two of them can collapse.
 *
 * The first axis is the TERMINAL ACTION, and it is why no minion variant can collapse into a
 * work-item variant: a work-item role ENDS in `signal-back`, but the `workItemId` in a minion's
 * briefing is its PARENT's, so a minion signalling on it would complete the parent's operation item
 * and advance the relay while the parent is still working.
 *
 * The second axis splits the minion family in two: whether the reader may itself delegate. A LEAF
 * minion that spawns its own sub-agent produces a grandchild whose conclusions no gate ever reads —
 * the parent verifies the minion's FILES, not a grandchild's summary — and a post-mortem measured
 * that shape costing 3m55s of a 10m20s minion run. Only a planning minion may delegate, and only for
 * a bounded spike on a pattern it cannot plan against without trying. A single shared block cannot
 * say both "never delegate" and "delegate for a spike": whichever mandate it carries contradicts the
 * other, and a prompt that contradicts itself is resolved by whichever instruction the agent reads
 * first.
 *
 * The third axis splits the WORK-ITEM family in two: whether the reader runs ward at all. Rule 3
 * tells its reader how to scope a ward run, and an OPERATOR runs none — its reviewer runs the
 * round's single `npm run ward -- --staged`. Handing an operator the scoping rule hands it back a
 * command its own prompt puts in the FORBIDDEN table, and a session that runs a ward it cannot read
 * the output of, on files it cannot open, competes with its reviewer for the same tree. So
 * `operatorMarkdown` swaps that one rule for its negation and shares the other four.
 *
 * Rules 1, 2 and 5 are identical across BOTH minion variants, and rules 1, 2, 4 and 5 across both
 * work-item variants — composed from shared consts here rather than copy-pasted into each.
 */

const heading = `## Operating Rules — READ FIRST (ignoring these wedges the whole quest)`;

const backgroundTaskRule = `**2. NEVER end your turn waiting for a background task, and NEVER poll for one.** A sub-agent does NOT receive an async wakeup when a detached background task finishes — end your turn waiting on one and your work item hangs forever. Keep every command short enough to finish in the foreground: one the harness auto-backgrounds is a sign you ran the wrong (too-broad) one, so scope it down and re-run scoped.`;

const wardScopeRule = `**3. Run ward SCOPED, ALWAYS in the foreground, with \`timeout: 600000\`. NEVER run the bare whole-repo \`npm run ward\`.** This rule OVERRIDES the \`<dungeonmaster-ward>\` snippet you were handed at session start: its "make it fully green" line is written for an agent working directly for the user, and you are not one. The full-repo regression sweep is the dispatcher's own \`run-ward\` work item that runs after you.

There are exactly TWO scoped forms, and your own prompt tells you which one is yours — do not choose between them:

- \`npm run ward -- --only <checks> -- <file1> <file2>\` — a NAMED file set. Those paths MUST be explicit FILE paths, NEVER a bare directory (\`-- packages/<pkg>\`): a directory scope pulls in the whole package and the harness auto-backgrounds it exactly like the whole-repo command, which strands your turn (see Rule 2).
- \`npm run ward -- --staged\` — every SOURCE FILE ORIGIN DOES NOT HAVE YET: unpushed commits plus uncommitted edits on top of them. It takes no other flag and needs none; ward REJECTS it combined with \`--only\`, \`--onlyTests\` or a file list, because the git scope owns the whole run.

The build-first, one-mode and run-once mechanics in the \`<dungeonmaster-ward-discipline>\` snippet apply to you unchanged.`;

const operatorNoWardRule = `**3. You run NO ward, NO test and NO check of any kind.** Your REVIEWER runs the round's ward, once, as \`npm run ward -- --staged\` — every check type, over every source file origin does not have yet, which IS this round because you push once at the end of each one. This OVERRIDES both the \`<dungeonmaster-ward>\` and the \`<dungeonmaster-ward-discipline>\` snippets you were handed at session start: neither is addressed to a session that opens no files. A ward you run yourself is a command whose output you cannot read, over files you cannot open, competing with your reviewer for the same tree.`;

const synchronousAgentRule = `**4. The \`Agent\`/Task tool is SYNCHRONOUS — awaiting a helper you spawn is allowed and does NOT violate Rule 2.** Rule 2 forbids ending your turn waiting on a backgrounded *shell* command. A sub-agent you spawn via \`Agent\` returns its result inline as the tool result within the same turn — you stay alive, read what it returns, and continue. If your role's prompt tells you to delegate isolated work to a helper, decide it EARLY (the model will not reliably stop to delegate deep into a long turn) and brief the helper fully. Then simply wait: the helper's result arrives as your next tool result, and waiting for it costs you nothing, because your turn never ended.`;

const deniedCommandWall = `You are dispatched with no interactive approver: a command outside the project's permission allowlist comes back \`This command requires approval\` and is DENIED outright, not queued for someone to accept. The same goes for a missing credential, an unreachable service, or a tool the sandbox does not expose.`;

const roleRule5Head = `**5. When the wall is the ENVIRONMENT, not the work, signal \`operationStatus: 'blocked'\` — never \`partial\`.** ${deniedCommandWall}

\`partial\` means *scope remains that another session of my role can pick up*; it costs a pt-chain attempt and spawns exactly the successor that will fail the same way. \`blocked\` means *no session of my role can proceed until a human changes something*: it halts the quest immediately, surfaces your reason to the user, and re-queues your operation item so a resume picks up right here. Include a \`blockedReason\` that names the wall AND what the user must change:

\`\`\`
signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'blocked', blockedReason: 'git commit is denied in this dispatched session (no approver); add Bash(git commit:*) to .claude/settings.json permissions.allow' })
\`\`\`

**"No session of my role could pass" is a claim about a FRESH session.** Per-session state is not global: each dispatch is its own process with its own MCP child, so a stale server or a module loaded before your fix landed is a wall for THIS session only. A wall a re-dispatch clears is \`partial\`.`;

const minionIntro = `You are a parent-summoned minion running as a sub-agent. These rules are non-negotiable for every file-changing minion — breaking any one of them strands the parent that is blocked waiting on you, and wedges the whole quest behind it.`;

const minionRule1 = `**1. NEVER call \`signal-back\` — your final message IS your terminal action.** You have no work item of your own. The \`workItemId\` in your briefing belongs to your PARENT: signalling on it would complete the parent's operation item and advance the relay while the parent is still working. Every path through this prompt — a clean pass, or a wall you cannot get past — ends by returning your block as your final message, and the LAST line of that block is always \`NEXT:\`. The parent is blocked on that message: it reads the \`NEXT:\` line, acts on that one word, and never opens a file to check the rest.`;

const minionRule5 = `**5. When the wall is the ENVIRONMENT, not the work, report it — do not work around it.** ${deniedCommandWall} Retrying it or rephrasing it cannot work, and neither can any sibling minion. That is what \`NEXT: wall — <what a human must change>\` is for, and it is the ONLY thing it is for: your parent turns that line into an \`operationStatus: 'blocked'\` that halts the whole quest, so work that merely remains unfinished is \`NEXT: rework\` instead. Do NOT paper over a wall, and do NOT report a green ward you did not actually get.`;

const delegatingSpikeRule = `**4. The \`Agent\`/Task tool is SYNCHRONOUS, and that is WHY a bounded spike is on the table at all — not a general licence to delegate.** Awaiting a helper you spawn does NOT violate Rule 2: it returns its result inline as the tool result within the same turn, so waiting for it costs you nothing. What that buys you is narrow: a SPIKE, and only a spike — trying a pattern nobody in this repo has built yet, so you find out whether it works BEFORE you commit a plan to it. You may NOT delegate your whole assignment to a helper, and a spike's result is never passed through as your own output: read what it found, decide what it means, and fold that decision into YOUR plan in your own words. A helper's conclusions are not a deliverable; your judgment on them is.`;

const leafBanRule = `**4. You are a LEAF. Do NOT call the \`Agent\`/Task tool.** Everything you need is in your briefing and on disk. A sub-agent you spawn produces work your parent cannot review — it reads YOUR files, not your helper's conclusions — and a leaf that delegates burns its parent's wall-clock on a result nobody grades. If your assignment genuinely cannot be done without work outside it, say so in your return and let your parent decide.`;

export const agentOperatingRulesStatics = {
  markdown: `${heading}

You are a Task-dispatched sub-agent. These rules are non-negotiable for every file-changing role — breaking any one of them strands your work item and wedges the whole quest behind you.

**1. ALWAYS call \`signal-back\` as the final action of your turn.** If you end your turn with a plain text message and no \`signal-back\`, your work item stays \`in_progress\` forever, downstream roles never dispatch, and there is no auto-retry. Every path through this prompt — success or failure — ends in exactly one \`signal-back(...)\` call (your role's terminal signal).

${backgroundTaskRule}

${wardScopeRule}

${synchronousAgentRule}

${roleRule5Head}

**A wall does not cancel the scope it leaves reachable**, and it marks your work item \`failed\` — a red row, not a clean handoff. Land whatever you finished in git first, exactly as you would for \`partial\`: a blocked quest still hands its work forward through git, and \`signal-back\` refuses every outcome while the tree is dirty.`,

  operatorMarkdown: `${heading}

You are a Task-dispatched sub-agent that DISPATCHES rather than builds. These rules are non-negotiable — breaking any one of them strands your work item and wedges the whole quest behind you.

**1. ALWAYS call \`signal-back\` as the final action of your turn.** If you end your turn with a plain text message and no \`signal-back\`, your work item stays \`in_progress\` forever, downstream roles never dispatch, and there is no auto-retry. Every path through this prompt — every outcome, including a wall — ends in exactly one \`signal-back(...)\` call.

${backgroundTaskRule}

${operatorNoWardRule}

${synchronousAgentRule}

${roleRule5Head}

**Your minions commit their own work, so the tree should already be clean when you signal** — and \`signal-back\` refuses every outcome, \`blocked\` included, while it is not. Clearing it is a step in your script, not something you do by committing: you cannot see what is sitting there.`,

  delegatingMinionMarkdown: `${heading}

${minionIntro}

${minionRule1}

${backgroundTaskRule}

${wardScopeRule}

${delegatingSpikeRule}

${minionRule5}`,

  leafMinionMarkdown: `${heading}

${minionIntro}

${minionRule1}

${backgroundTaskRule}

${wardScopeRule}

${leafBanRule}

${minionRule5}`,
} as const;
