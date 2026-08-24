/**
 * PURPOSE: The shared "Operating Rules" block that opens every file-changing agent prompt, exported
 * one rule at a time. Reach for a piece here rather than writing the sentence into a prompt: the
 * same rule reaches four kinds of reader, and a sentence written into one of them drifts from the
 * other three. The prompt that uses a piece composes its own block, so the whole prompt reads in
 * one file.
 *
 * USAGE:
 * agentOperatingRulesStatics.heading;
 * agentOperatingRulesStatics.turnEndRole;
 * agentOperatingRulesStatics.background;
 * // Markdown fragments. A consuming prompt interpolates the ones its reader takes, separated by
 * // blank lines, in the column order of the table below
 *
 * WHICH PROMPT TAKES WHICH PIECES:
 *
 * | Prompt | [TURN END] | [WARD] | [DELEGATION] | [WALL] | [CLEAN TREE] |
 * |---|---|---|---|---|---|
 * | spiritmender, warpgate | `turnEndRole` | `wardScoped` | `delegationSynchronous` | `wallRole` | `treeCleanRole` |
 * | operator-prompt | `turnEndRole` | `wardNone` | `delegationSynchronous` | `wallRole` | `treeCleanOperator` |
 * | planner-minion | `turnEndMinion` | `wardNone` | `delegationSpike` | `wallMinion` | — |
 * | worker-minion | `turnEndMinion` | `wardScoped` | `delegationLeafBan` | `wallMinion` | — |
 * | reviewer-minion | `turnEndMinion` | `wardScoped` | `delegationLeafBan` | `wallMinion` | — |
 *
 * Every row opens on `heading` and takes `background` unchanged between [TURN END] and [WARD]. A
 * work-item role gets six rules, a minion five; [CLEAN TREE] is the one no minion takes, because a
 * minion never signals and so is never refused for a dirty tree.
 *
 * THE TAG IS THE RULE'S ID. Each rule opens with one of six bracketed tags — [TURN END],
 * [BACKGROUND], [WARD], [DELEGATION], [WALL], [CLEAN TREE] — and everything that cites a rule names
 * that tag, including the half-dozen sibling prompts that cite one from inside their own text. A tag
 * survives a rule being inserted, dropped or reordered. A position number does not: it re-points
 * every one of those citations at whichever rule lands in that slot. A tag also says what the rule
 * is about.
 *
 * **EVERY EXPORT HERE EXCEPT `heading` OPENS WITH ITS TAG, IN BOLD, AS ITS FIRST CHARACTERS.** Add a
 * piece without one and it renders as loose prose in the middle of a numbered-feeling list: nothing
 * can cite it, and the reader cannot tell where the rule before it stopped. `heading` is the one
 * exception because it is the FRAME — it introduces the tags and closes on the subheading the rules
 * render under, so a tag on it would name a rule that is not there. The colocated test asserts the
 * tag of every export by key, so a new piece fails until it has one.
 *
 * THE THREE AXES ARE WHY A PIECE HAS TWO OR THREE FORMS. No prompt may take both sides of one axis.
 *
 * AXIS 1 IS THE TERMINAL ACTION, and it splits [TURN END] in two. A work-item role ends its turn in
 * `signal-back`, whether it changes files or only dispatches. A minion may never call it: the
 * `workItemId` in a minion's briefing belongs to its PARENT, so signalling on it would complete the
 * parent's operation item and advance the relay while the parent is still working.
 *
 * AXIS 2 SPLITS THE MINION FAMILY, on whether the reader may delegate. A leaf minion that spawns its
 * own sub-agent produces a grandchild whose conclusions no gate ever reads. The parent verifies the
 * minion's FILES rather than a grandchild's summary. A post-mortem measured what that shape costs:
 * 3m55s of a 10m20s minion run. Only a planning minion takes `delegationSpike`, for two bounded
 * things: a pattern it cannot plan against without trying it, and ONE review of its finished draft.
 *
 * THE DRAFT REVIEW IS THERE BECAUSE NOTHING ELSE CHECKS A PLAN. The operator reads the plan but is
 * forbidden every source file, so it cannot compare that plan to the tree; the round's reviewer
 * arrives after every worker has already executed against it. So the one session that could catch a
 * wrong plan is the one that wrote it, which is the shape "the author never grades its own work"
 * exists to prevent everywhere else in this pipeline.
 *
 * THE KEY NAME IS NOW NARROWER THAN THE RULE. It should read `delegationPlanner`; the rename is
 * deferred so the colocated test keeps compiling, and is owed the next time this file is touched.
 * `delegationSynchronous` is misnamed in the other direction and for the same reason: the tool it
 * describes is ASYNCHRONOUS, and both rules now say so.
 *
 * BOTH DELEGATION RULES USED TO CLAIM THE `Agent` TOOL WAS SYNCHRONOUS. It is not. The call returns
 * "launched" and a notification delivers the result later. A planner that believed the old wording
 * improvised `sleep 90 → 120 → 150 → 240` around its own draft reviewer: 600 seconds of sleeping on
 * a 2,066-second run, reading the answer 257 seconds after it landed. The ban on polling is written
 * into both rules in the same shape as the ward-discipline snippet's ban on `sleep N && tail`,
 * because a prompt that merely states the truth leaves the agent to invent the waiting strategy.
 *
 * AXIS 3 IS WHETHER THE READER RUNS A BUILD AND A WARD AT ALL, and it cuts across both families
 * rather than down one. `wardScoped` names the two scoped forms and says the reader's own prompt
 * picks which: a REVIEWER runs `--staged` over the whole round, a worker runs the named-file form
 * over its own chunk. `wardNone` goes to the two sessions that run neither — the OPERATOR, which
 * opens no file and so could not act on a result, and the PLANNER, which only WRITES a ward line for
 * a worker. One session per round runs a build, and that is what keeps a wave of parallel workers off
 * each other's tree: ward's typecheck is `tsc -b`, which BUILDS.
 *
 * THAT ONE SESSION IS THE REVIEWER, AND IT RUNS BOTH LAST — after it has opened every file the round
 * produced. Neither reader of this rule may open a source file, so a compile error or a red check
 * reaches either of them as text it can only forward. The reviewer holds the errors and the files at
 * once, and already fixes what it finds, so it closes a straggler in the same turn.
 *
 * A PROMPT THAT TAKES BOTH SIDES OF AN AXIS CONTRADICTS ITSELF. One block cannot say both "never
 * delegate" and "delegate for a spike". An agent reading that follows whichever it reads first. Each
 * consuming prompt's own test asserts the pieces it carries AND the pieces it must not.
 */

const heading = `## Operating Rules

Read every rule below before you do anything else. Each rule opens with its TAG in brackets. For example [TURN END], [BACKGROUND], etc. Anything that cites a rule — here, or later in this prompt — names that tag. All rules MUST be followed. No one rule has more priority over any others.

### Rules to follow`;

const turnEndRole = `**[TURN END] ALWAYS call \`signal-back\` as the final action of your turn.** Every path through this prompt ends in exactly one \`signal-back(...)\` call. That call carries your role's terminal signal. Every failure path ends there too. End your turn with a plain text message and no \`signal-back\`, and your work item stays \`in_progress\` for good. No downstream role dispatches. Nothing retries you.`;

const turnEndMinion = `**[TURN END] NEVER call \`signal-back\`. Your final message IS your terminal action.** You have no work item of your own. The \`workItemId\` in your briefing belongs to your PARENT. Signalling on it would complete the parent's operation item. It would also advance the relay while the parent is still working. Every path through this prompt ends the same way: you return your block as your final message. That covers a clean pass and a wall you cannot get past alike. The LAST line of that block is always \`NEXT:\`. Your parent is blocked on that message. It reads the \`NEXT:\` line. It acts on that one word. It never opens a file to check the rest.`;

const background = `**[BACKGROUND] Never end your turn waiting for a background task. Never poll for one.** Nothing wakes a sub-agent when a detached background task finishes. End your turn waiting on one and your work item hangs for good. Keep every command short enough to finish in the foreground. A command the harness auto-backgrounds is one you scoped too broadly. Narrow it. Run it again.`;

const wardScoped = `**[WARD] Run ward scoped, in the foreground, with \`timeout: 600000\`. Never run the bare whole-repo \`npm run ward\`.** This rule OVERRIDES the \`<dungeonmaster-ward>\` snippet you were handed at session start. That snippet's "make it fully green" line is written for an agent working directly for the user. You are not one. The whole-repo run is the dispatcher's own \`run-ward\` work item. It runs after you.

There are exactly TWO scoped forms. Do not choose between them. Your own prompt tells you which one is yours:

- \`npm run ward -- --only <checks> -- <file1> <file2>\` — a NAMED file set. Every path is an explicit FILE path, NEVER a bare directory (\`-- packages/<pkg>\`). A directory scope pulls in the whole package. The harness then auto-backgrounds the run. That strands your turn, exactly as the whole-repo command does. See [BACKGROUND].
- \`npm run ward -- --staged\` — every SOURCE FILE ORIGIN DOES NOT HAVE YET: unpushed commits, plus uncommitted edits on top of them. It takes no other flag. It needs none. Ward REJECTS it combined with \`--only\`, \`--onlyTests\` or a file list, because the git scope owns the whole run.

Three mechanics in the \`<dungeonmaster-ward-discipline>\` snippet apply to you unchanged: build first, pick ONE mode, and run it once.`;

const wardNone = `**[WARD] You run NO build, NO ward, NO test and NO check of any kind.** The round's \`reviewer-minion\` runs both, ONCE, after every worker has returned AND after it has opened every file the round produced: \`npm run build\`, then \`npm run ward -- --staged\` — every check type over every source file origin does not have yet. That range IS the round. This OVERRIDES both the \`<dungeonmaster-ward>\` and the \`<dungeonmaster-ward-discipline>\` snippets you were handed at session start. Neither is addressed to a session that runs neither. ONE session per round runs them, and that is what keeps a wave of parallel workers off each other's tree: \`tsc\` writes one shared \`dist/\` per package, and ward's typecheck is \`tsc -b\`, which BUILDS. That session is also the only one that can FIX what they turn up, because it is the only one with every file open.`;

const delegationSynchronous = `**[DELEGATION] The \`Agent\`/Task tool is ASYNCHRONOUS. Its return says the helper was LAUNCHED — that return is not the result.** The result reaches you later, on its own, as a completion notification. **Never \`sleep\`. Never poll. Never re-run a command to check whether it finished.** Every one of those burns wall-clock while the answer is already coming: one measured session spent 600 seconds sleeping and read its helper's answer 257 seconds after that answer existed. **Do not end your turn while a helper is still out**, either — your own final message is terminal, and a result that lands after it reaches nobody. [BACKGROUND] forbids ending your turn on a backgrounded *shell* command, and this is the same rule from the other side: a shell task nothing wakes you for, versus a helper that wakes you without being asked. If your role's prompt tells you to delegate isolated work, decide it EARLY — the model will not reliably stop to delegate deep into a long turn. Brief the helper fully, then let the notification reach you.`;

const delegationSpike = `**[DELEGATION] You delegate EXPLORATION and CHECKING. You never delegate JUDGEMENT.** Three uses, and nothing else. **EXPLORERS**, several at once, to find what already exists in a tree too large for one session to read — this is the normal case and the reason you may delegate at all. **CHECKERS**, to test what you have written against the real tree. **A SPIKE**, rarely, to try a pattern nobody in this repo has built yet, when you cannot plan against it without trying it.

**They report. You rule.** A helper hands you paths, line numbers and contradictions. What those MEAN for the plan is yours alone, and you write it in your own words. **Never pass a helper's conclusions up as your own output**, and never hand a helper the whole assignment — a plan assembled from summaries is a plan nobody read the code for.

**Every one of them is ASYNCHRONOUS.** The \\\`Agent\\\` call returns the moment the helper launches, and that return is NOT its answer — a completion notification brings the answer later, on its own. **Dispatch siblings in ONE message so they run at once. Never \\\`sleep\\\`, never poll, never re-run a command to see whether one is done.** A measured planner spent 600 seconds sleeping and read its helper's report 257 seconds after that report existed — a third of its entire run.`;

const delegationLeafBan = `**[DELEGATION] You are a LEAF. Do NOT call the \`Agent\`/Task tool.** Everything you need is in your briefing and on disk. A sub-agent you spawn produces work your parent cannot review, because your parent reads YOUR files, not your helper's conclusions. A leaf that delegates spends its parent's time on a result nobody grades. If you genuinely cannot finish your assignment without work outside it, say so in your return. Let your parent decide.`;

const deniedCommandWall = `You are dispatched with nobody there to approve a command. A command outside the project's permission allowlist comes back \`This command requires approval\`. It is DENIED outright. Nobody will accept it later. The same goes for a missing credential, an unreachable service, and a tool the sandbox does not expose. Each of those is a WALL.

**A denied command is a wall only if the JOB has no other route.** Here \`Read\`+\`offset\`, \`discover\` and \`python3 -c\` replace \`sed\`/\`grep\`/\`find\`/\`rg\`. Swap the tool first.`;

const wallRole = `**[WALL] When the ENVIRONMENT blocks you rather than the work, signal \`operationStatus: 'blocked'\`. Never \`partial\`.** ${deniedCommandWall}

| Outcome | What it means | What it does |
|---|---|---|
| \`partial\` | Scope remains that another session of my role can pick up. | Costs a pt-chain attempt. Spawns exactly the successor that will fail the same way. |
| \`blocked\` | No session of my role can proceed until a human changes something. | Halts the quest at once. Shows your reason to the user. Re-queues your operation item, so a resume picks up right here. |

Include a \`blockedReason\` that names the wall AND what the user must change:

\`\`\`
signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'blocked', blockedReason: 'git commit is denied in this dispatched session (no approver); add Bash(git commit:*) to .claude/settings.json permissions.allow' })
\`\`\`

**"No session of my role could pass" is a claim about a FRESH session.** Per-session state is not global. Each dispatch is its own process, with its own MCP child. A stale server is a wall for THIS session only. So is a module loaded before your fix landed. A wall that a re-dispatch clears is \`partial\`.`;

const wallMinion = `**[WALL] When the ENVIRONMENT blocks you rather than the work, report it. Do not work around it.** ${deniedCommandWall} You cannot get past a wall by retrying. You cannot get past one by rephrasing. No sibling minion can get past one either. Report the wall as \`NEXT: wall — <what a human must change>\`. Write that line for nothing else. Your parent turns that line into an \`operationStatus: 'blocked'\` that halts the whole quest. Work that merely remains unfinished is \`NEXT: rework\` instead. **A wall your parent can clear by restarting a resource it owns is \`NEXT: rework\`, not \`NEXT: wall\`.** A dev server your parent started is where minions get this wrong. A URL that stops answering is \`NEXT: rework\`, because a restart makes it answer again. Write \`wall\` only for what a FRESH session hits exactly as you did. Do NOT paper over a wall. Do NOT report a green ward you did not actually get.`;

const treeCleanRole = `**[CLEAN TREE] Land whatever you finished in git first, whatever you are about to signal.** \`signal-back\` refuses \`done\`, \`partial\` and \`blocked\` alike while the worktree carries uncommitted changes, tracked or untracked. A wall does not cancel the scope it leaves reachable. \`blocked\` also marks your work item \`failed\`. That renders as a red row rather than a clean handoff. A blocked quest hands its work forward through git the same way a finished one does.`;

const treeCleanOperator = `**[CLEAN TREE] Your worktree must be clean before you signal.** It should already be: your reviewer commits the whole round. \`signal-back\` refuses every outcome while the tree is dirty, \`blocked\` included. Your script has a step that clears a dirty tree. **Never clear one by committing.** You cannot see what is sitting there.`;

export const agentOperatingRulesStatics = {
  heading,
  turnEndRole,
  turnEndMinion,
  background,
  wardScoped,
  wardNone,
  delegationSynchronous,
  delegationSpike,
  delegationLeafBan,
  wallRole,
  wallMinion,
  treeCleanRole,
  treeCleanOperator,
} as const;
