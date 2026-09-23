import { subagentStopBlockMessageStatics } from './subagent-stop-block-message-statics';

describe('subagentStopBlockMessageStatics', () => {
  it('VALID: exported object => matches both SubagentStop block messages', () => {
    expect(subagentStopBlockMessageStatics).toStrictEqual({
      blockMessage:
        'You are ending your turn without calling signal-back, but your work item is still in_progress. If a helper is still out, ignore this: end your turn again and its notification will re-enter you. Otherwise you have nothing left coming, and a work-item sub-agent that stops there strands its work item until orphan recovery reclaims it, holding the whole quest behind it. Call mcp__dungeonmaster__signal-back now with signal "complete" — that is the only signal kind, and it takes no outcome field. Add a blockedReason naming the wall only if the environment stopped you before you could finish. Then stop.',
      backgroundTaskMessage:
        'You are ending your turn while a command YOU started in the background is STILL RUNNING. Your final response TERMINATES every background command you own, and no notification can follow that response, so nothing here finishes on its own after you stop. This block names only commands your own transcript shows you starting, so nothing anybody else is running can be what is holding you — do NOT go hunting the process table for something to kill, and never signal a process you did not start. Work out which of these two cases each still-running command is in, and act on it now. (1) YOU ARE WAITING ON ITS RESULT — a ward run, a build, a test suite, an install. Do NOT end your turn. Stay in this turn and poll: repeat a bounded foreground Bash call that waits for the file or marker the command writes, then read that marker, and give your final response only once the command has actually exited. Ending your turn here kills it part-way and throws the work away while your turn reports success. (2) YOU ARE DONE WITH IT — a dev server, a preview server, a watcher, a test lane, anything you started only so other work could run against it and whose result you do not need. Shut it down now, in this turn, then stop. Where it has a shutdown of its own — a stop command, an `end` written into the directory it takes commands from, a documented signal — use THAT, then poll until the process has actually exited. An orderly shutdown is the only thing that also takes down the servers and browsers a supervisor spawned; a SIGKILL on the supervisor strands every one of them. Kill the process only where it offers no such channel. Leaving it up does not keep it alive past your final response; it only strands its port and hides the shutdown from whoever reads your report. Either way the command must no longer be running when you next try to stop — that is what clears this block.',
    });
  });

  // packages/mcp/src/contracts/signal-back-input/signal-back-input-contract.ts and its server mirror
  // (packages/server/src/contracts/signal-back-input/signal-back-input-contract.ts) are both
  // `.strict()` over exactly {questId, workItemId, signal, operationItemId?, blockedReason?} — an
  // `operationStatus` key throws a parse error rather than being silently dropped. `statics/` files
  // may import only `statics/` (this repo's architecture rule), so the contract cannot be imported
  // here to derive its shape; the rejected key name is pinned instead. This regression would have
  // caught the bug where blockMessage told every agent to send `operationStatus`, which both
  // contracts reject outright.
  it('VALID: blockMessage => never tells an agent to send operationStatus, the key signalBackInputContract .strict()-rejects', () => {
    const occurrenceCount =
      subagentStopBlockMessageStatics.blockMessage.split('operationStatus').length - 1;

    expect(occurrenceCount).toBe(0);
  });
});
