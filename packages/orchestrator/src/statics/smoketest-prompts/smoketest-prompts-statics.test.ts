import { smoketestPromptsStatics } from './smoketest-prompts-statics';

describe('smoketestPromptsStatics', () => {
  it('VALID: {smoketestPromptsStatics} => exposes non-empty prompts for every signal variant', () => {
    expect({
      signalCompleteNonEmpty: smoketestPromptsStatics.signalComplete.length > 0,
      signalFailedNonEmpty: smoketestPromptsStatics.signalFailed.length > 0,
      signalFailedReplanNonEmpty: smoketestPromptsStatics.signalFailedReplan.length > 0,
    }).toStrictEqual({
      signalCompleteNonEmpty: true,
      signalFailedNonEmpty: true,
      signalFailedReplanNonEmpty: true,
    });
  });

  it('VALID: {discover probe} => call-then-conditional-signal prompt with success+error summaries', () => {
    expect(smoketestPromptsStatics['discover' as keyof typeof smoketestPromptsStatics]).toBe(
      'Do exactly two things and nothing else: 1) Call "mcp__dungeonmaster__discover" with {"glob":"packages/*/src/statics/**"}. 2) If the tool call errors, call "mcp__dungeonmaster__signal-back" with { "signal": "failed", "summary": "mcp-discover-tool-error" } and stop. If the tool call succeeds, call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-discover-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {signal-back probe} => signal-only prompt with no tool call', () => {
    expect(smoketestPromptsStatics['signal-back' as keyof typeof smoketestPromptsStatics]).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-signal-back-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {ask-user-question probe} => skip-call prompt refuses to call ask-user-question', () => {
    expect(
      smoketestPromptsStatics['ask-user-question' as keyof typeof smoketestPromptsStatics],
    ).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-ask-user-question-probe-ok (deferred: calling ask-user-question would block the smoketest)" }. Do not call ask-user-question and do not output anything else.',
    );
  });

  it('VALID: {start-quest} => skip-from-suite produces no probe prompt', () => {
    expect(Reflect.has(smoketestPromptsStatics, 'start-quest')).toBe(false);
  });
});
