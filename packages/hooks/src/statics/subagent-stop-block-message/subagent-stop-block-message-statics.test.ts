import { subagentStopBlockMessageStatics } from './subagent-stop-block-message-statics';

describe('subagentStopBlockMessageStatics', () => {
  it('VALID: exported object => matches the SubagentStop block message', () => {
    expect(subagentStopBlockMessageStatics).toStrictEqual({
      blockMessage:
        'You are ending your turn without calling signal-back, but your work item is still in_progress. If a helper or a backgrounded command is still out, ignore this: end your turn again and its notification will re-enter you. Otherwise you have nothing left coming, and a work-item sub-agent that stops there strands its work item until orphan recovery reclaims it, holding the whole quest behind it. Call mcp__dungeonmaster__signal-back now with signal "complete" — that is the only signal kind, and the outcome rides on operationStatus: "done" when the work is finished and verified, or "blocked" with a blockedReason naming the wall when the environment stopped you. Then stop.',
    });
  });
});
