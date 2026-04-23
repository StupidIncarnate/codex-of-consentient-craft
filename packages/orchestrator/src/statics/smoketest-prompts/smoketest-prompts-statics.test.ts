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

  it('VALID: {discover probe} => two-step call-then-signal prompt with summary', () => {
    expect(Reflect.get(smoketestPromptsStatics, 'discover')).toBe(
      'Do exactly two things and nothing else: 1) Call "mcp__dungeonmaster__discover" with {"glob":"packages/*/src/statics/**"}. 2) Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-discover-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {signal-back probe} => signal-only prompt with no tool call', () => {
    expect(Reflect.get(smoketestPromptsStatics, 'signal-back')).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-signal-back-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {ask-user-question probe} => skip-call prompt refuses to call ask-user-question', () => {
    expect(Reflect.get(smoketestPromptsStatics, 'ask-user-question')).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "signal": "complete", "summary": "mcp-ask-user-question-probe-ok (deferred: calling ask-user-question would block the smoketest)" }. Do not call ask-user-question and do not output anything else.',
    );
  });
});
