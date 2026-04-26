import { mcpToolsStatics } from '@dungeonmaster/shared/statics';

import { smoketestProbeArgsStatics } from './smoketest-probe-args-statics';

describe('smoketestProbeArgsStatics', () => {
  it('VALID: {keys} => matches mcpToolsStatics.tools.names 1:1', () => {
    const probeKeys = Object.keys(smoketestProbeArgsStatics).sort();
    const toolNames = [...mcpToolsStatics.tools.names].sort();

    expect(probeKeys).toStrictEqual(toolNames);
  });

  it('VALID: {every entry} => has non-empty mode and summary strings', () => {
    const modeLengths = Object.values(smoketestProbeArgsStatics).map((spec) => spec.mode.length);
    const summaryLengths = Object.values(smoketestProbeArgsStatics).map(
      (spec) => spec.summary.length,
    );

    expect(Math.min(...modeLengths)).toBeGreaterThan(0);
    expect(Math.min(...summaryLengths)).toBeGreaterThan(0);
  });

  it('VALID: {signal-back} => uses signal-only mode', () => {
    expect(smoketestProbeArgsStatics['signal-back'].mode).toBe('signal-only');
  });

  it('VALID: {ask-user-question} => uses skip-call mode', () => {
    expect(smoketestProbeArgsStatics['ask-user-question'].mode).toBe('skip-call');
  });

  it('VALID: {start-quest} => uses skip-from-suite mode (orchestration suite owns this)', () => {
    expect(smoketestProbeArgsStatics['start-quest'].mode).toBe('skip-from-suite');
  });
});
