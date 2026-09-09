/**
 * PURPOSE: The two reasons the SubagentStop hook feeds back when it refuses a stop. `blockMessage`
 * is for a work-item agent that never called signal-back and would strand its work item;
 * `backgroundTaskMessage` is for any sub-agent whose backgrounded command is still running and would
 * be terminated by its final response. Reach for the second whenever the work is in a process rather
 * than in a ledger — the first names a quest and means nothing to a sub-agent that owns no work item.
 *
 * `backgroundTaskMessage` routes to WAIT or to KILL, and carrying both is what stops it deadlocking:
 * a long-lived process the agent is finished with — a dev server, a watcher, a siege lane — never
 * reports anything but `running`, so a message that only said "wait" would hold that agent open
 * forever. Both branches end with the command no longer running, which is what clears the block.
 *
 * USAGE:
 * subagentStopBlockMessageStatics.backgroundTaskMessage;
 * // Returns: the reason string surfaced to a sub-agent stopping on a live background task
 */

export const subagentStopBlockMessageStatics = {
  blockMessage:
    'You are ending your turn without calling signal-back, but your work item is still in_progress. If a helper is still out, ignore this: end your turn again and its notification will re-enter you. Otherwise you have nothing left coming, and a work-item sub-agent that stops there strands its work item until orphan recovery reclaims it, holding the whole quest behind it. Call mcp__dungeonmaster__signal-back now with signal "complete" — that is the only signal kind, and the outcome rides on operationStatus: "done" when the work is finished and verified, or "blocked" with a blockedReason naming the wall when the environment stopped you. Then stop.',
  backgroundTaskMessage:
    'You are ending your turn while a command you started in the background is STILL RUNNING. Your final response TERMINATES every background command you own, and no notification can follow that response, so nothing here finishes on its own after you stop. Work out which of these two cases each still-running command is in, and act on it now. (1) YOU ARE WAITING ON ITS RESULT — a ward run, a build, a test suite, an install. Do NOT end your turn. Stay in this turn and poll: repeat a bounded foreground Bash call that waits for the file or marker the command writes, then read that marker, and give your final response only once the command has actually exited. Ending your turn here kills it part-way and throws the work away while your turn reports success. (2) YOU ARE DONE WITH IT — a dev server, a preview server, a watcher, a test lane, anything you started only so other work could run against it and whose result you do not need. Kill it now, in this turn, then stop. Leaving it up does not keep it alive past your final response; it only strands its port and hides the shutdown from whoever reads your report. Either way the command must no longer be running when you next try to stop — that is what clears this block.',
} as const;
