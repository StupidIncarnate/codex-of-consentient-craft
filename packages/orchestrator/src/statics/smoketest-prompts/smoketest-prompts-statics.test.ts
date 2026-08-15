import { smoketestPromptsStatics } from './smoketest-prompts-statics';

// Every canned prompt names the two REQUIRED signal-back arguments as placeholders. A scripted
// agent's whole context is this one line — it never calls `get-agent-prompt` — so a prompt omitting
// them produces a call the tool rejects, and the agent has nothing to recover the ids from. The
// placeholders are resolved to live ids by the sweep broker (orchestration) and the substitution
// transformer (bundled suites).
describe('smoketestPromptsStatics', () => {
  it('VALID: {smoketestPromptsStatics} => signalComplete emits complete with the smoketest summary', () => {
    expect(smoketestPromptsStatics.signalComplete).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "questId": "{{questId}}", "workItemId": "{{workItemId}}", "signal": "complete", "summary": "smoketest-complete" }. Do not output anything else.',
    );
  });

  it('VALID: {signalDone} => emits complete with operationStatus done', () => {
    expect(smoketestPromptsStatics.signalDone).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "questId": "{{questId}}", "workItemId": "{{workItemId}}", "signal": "complete", "operationStatus": "done" }. Do not output anything else.',
    );
  });

  it('VALID: {signalPartial} => emits complete with operationStatus partial', () => {
    expect(smoketestPromptsStatics.signalPartial).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "questId": "{{questId}}", "workItemId": "{{workItemId}}", "signal": "complete", "operationStatus": "partial" }. Do not output anything else.',
    );
  });

  it('VALID: {discover probe} => call-then-report-on-error, signal complete only on success', () => {
    expect(smoketestPromptsStatics['discover' as keyof typeof smoketestPromptsStatics]).toBe(
      'Do exactly two things and nothing else: 1) Call "mcp__dungeonmaster__discover" with {"glob":"packages/*/src/statics/**"}. 2) If the tool call errors, report the error and stop without signaling. If the tool call succeeds, call "mcp__dungeonmaster__signal-back" with { "questId": "{{questId}}", "workItemId": "{{workItemId}}", "signal": "complete", "summary": "mcp-discover-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {signal-back probe} => signal-only prompt with no tool call', () => {
    expect(smoketestPromptsStatics['signal-back' as keyof typeof smoketestPromptsStatics]).toBe(
      'Do exactly one thing and nothing else: Call "mcp__dungeonmaster__signal-back" with { "questId": "{{questId}}", "workItemId": "{{workItemId}}", "signal": "complete", "summary": "mcp-signal-back-probe-ok" }. Do not output anything else.',
    );
  });

  it('VALID: {siegeVerifyDevServer} => carries the required signal-back ids like every other canned prompt', () => {
    expect(smoketestPromptsStatics.siegeVerifyDevServer).toBe(
      'Do exactly two things and nothing else: 1) fetch GET http://dungeonmaster.localhost:4751/ and verify it returns 200. 2) Call "mcp__dungeonmaster__signal-back" with { "questId": "{{questId}}", "workItemId": "{{workItemId}}", "signal": "complete", "summary": "dev-server-verified" }. Do not output anything else.',
    );
  });

  it('VALID: {start-quest} => skip-from-suite produces no probe prompt', () => {
    expect(Reflect.has(smoketestPromptsStatics, 'start-quest')).toBe(false);
  });

  it('VALID: {ask-user-question} => decommissioned tool produces no probe prompt', () => {
    expect(Reflect.has(smoketestPromptsStatics, 'ask-user-question')).toBe(false);
  });
});
