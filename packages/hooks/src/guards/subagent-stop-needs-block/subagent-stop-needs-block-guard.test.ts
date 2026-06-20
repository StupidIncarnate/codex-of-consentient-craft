import { subagentStopNeedsBlockGuard } from './subagent-stop-needs-block-guard';
import { TranscriptToolInvocationStub } from '../../contracts/transcript-tool-invocation/transcript-tool-invocation.stub';

describe('subagentStopNeedsBlockGuard', () => {
  it('VALID: {work-item agent, no signal-back, stopHookActive false} => returns true', () => {
    const invocations = [
      TranscriptToolInvocationStub({
        name: 'mcp__dungeonmaster__get-agent-prompt',
        workItemId: 'w1',
      }),
      TranscriptToolInvocationStub({ name: 'Bash', workItemId: null }),
    ];

    expect(subagentStopNeedsBlockGuard({ invocations, stopHookActive: false })).toBe(true);
  });

  it('VALID: {work-item agent that called signal-back} => returns false', () => {
    const invocations = [
      TranscriptToolInvocationStub({
        name: 'mcp__dungeonmaster__get-agent-prompt',
        workItemId: 'w1',
      }),
      TranscriptToolInvocationStub({
        name: 'mcp__dungeonmaster__signal-back',
        workItemId: 'w1',
      }),
    ];

    expect(subagentStopNeedsBlockGuard({ invocations, stopHookActive: false })).toBe(false);
  });

  it('VALID: {work-item agent, no signal-back, but stopHookActive true} => returns false', () => {
    const invocations = [
      TranscriptToolInvocationStub({
        name: 'mcp__dungeonmaster__get-agent-prompt',
        workItemId: 'w1',
      }),
    ];

    expect(subagentStopNeedsBlockGuard({ invocations, stopHookActive: true })).toBe(false);
  });

  it('VALID: {minion get-agent-prompt with null workItemId} => returns false', () => {
    const invocations = [
      TranscriptToolInvocationStub({
        name: 'mcp__dungeonmaster__get-agent-prompt',
        workItemId: null,
      }),
    ];

    expect(subagentStopNeedsBlockGuard({ invocations, stopHookActive: false })).toBe(false);
  });

  it('VALID: {no get-agent-prompt call at all} => returns false', () => {
    const invocations = [TranscriptToolInvocationStub({ name: 'Bash', workItemId: null })];

    expect(subagentStopNeedsBlockGuard({ invocations, stopHookActive: false })).toBe(false);
  });

  it('EMPTY: {no invocations} => returns false', () => {
    expect(subagentStopNeedsBlockGuard({ invocations: [], stopHookActive: false })).toBe(false);
  });
});
