import { smoketestPromptsStatics } from './smoketest-prompts-statics';

describe('smoketestPromptsStatics', () => {
  it('VALID: {smoketestPromptsStatics} => signalComplete emits complete with the smoketest summary', () => {
    expect(smoketestPromptsStatics.signalComplete).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "smoketest-complete" }. Do not output anything else.',
    );
  });

  it('VALID: {signalDone} => emits complete with operationStatus done', () => {
    expect(smoketestPromptsStatics.signalDone).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "operationStatus": "done" }. Do not output anything else.',
    );
  });

  it('VALID: {signalPartial} => emits complete with operationStatus partial', () => {
    expect(smoketestPromptsStatics.signalPartial).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "operationStatus": "partial" }. Do not output anything else.',
    );
  });

  it('VALID: {discover probe} => call-then-report-on-error, signal complete only on success', () => {
    expect(smoketestPromptsStatics['discover' as keyof typeof smoketestPromptsStatics]).toBe(
      'Do exactly two things and nothing else: 1) Call "mcp__dungeonmaster__discover" with {"glob":"packages/*/src/statics/**"}. 2) If the tool call errors, report the error and stop without signaling. If the tool call succeeds, call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-discover-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {signal-back probe} => signal-only prompt with no tool call', () => {
    expect(smoketestPromptsStatics['signal-back' as keyof typeof smoketestPromptsStatics]).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-signal-back-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {start-quest} => skip-from-suite produces no probe prompt', () => {
    expect(Reflect.has(smoketestPromptsStatics, 'start-quest')).toBe(false);
  });

  it('VALID: {ask-user-question} => decommissioned tool produces no probe prompt', () => {
    expect(Reflect.has(smoketestPromptsStatics, 'ask-user-question')).toBe(false);
  });
});
