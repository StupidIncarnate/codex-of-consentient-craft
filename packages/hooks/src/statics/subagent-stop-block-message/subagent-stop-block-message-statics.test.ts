import { subagentStopBlockMessageStatics } from './subagent-stop-block-message-statics';

describe('subagentStopBlockMessageStatics', () => {
  it('VALID: exported object => matches the SubagentStop block message', () => {
    expect(subagentStopBlockMessageStatics).toStrictEqual({
      blockMessage:
        'You are ending your turn without calling signal-back, but your work item is still in_progress. A work-item sub-agent that stops without signalling strands its work item forever and wedges the whole quest behind it — there is no async wakeup and no auto-retry. Call mcp__dungeonmaster__signal-back now with signal "complete" (the work is done and verified) or "failed" (you are genuinely blocked), then stop.',
    });
  });
});
