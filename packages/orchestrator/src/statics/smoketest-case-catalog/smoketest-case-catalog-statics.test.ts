import { mcpToolsStatics } from '@dungeonmaster/shared/statics';

import { smoketestProbeArgsStatics } from '../smoketest-probe-args/smoketest-probe-args-statics';
import { smoketestCaseCatalogStatics } from './smoketest-case-catalog-statics';

const exercisedTools = mcpToolsStatics.tools.names.filter(
  (n) => smoketestProbeArgsStatics[n].mode !== 'skip-from-suite',
);

describe('smoketestCaseCatalogStatics', () => {
  it('VALID: {mcp} => case IDs derived from every non-skip-from-suite tool in mcpToolsStatics.tools.names', () => {
    const expected = [...exercisedTools].map((n) => `mcp-${n}`).sort();

    expect(smoketestCaseCatalogStatics.mcp.map((c) => c.caseId).sort()).toStrictEqual(expected);
  });

  it('VALID: {mcp} => every entry has promptKey equal to the tool name', () => {
    const pairs = smoketestCaseCatalogStatics.mcp.map((c) => ({
      caseId: c.caseId,
      promptKey: c.promptKey,
    }));

    const expected = exercisedTools.map((toolName) => ({
      caseId: `mcp-${toolName}`,
      promptKey: toolName,
    }));

    expect(pairs).toStrictEqual(expected);
  });

  it('VALID: {start-quest} => excluded from MCP case catalog (skip-from-suite)', () => {
    const hasStartQuest = smoketestCaseCatalogStatics.mcp.some(
      (c) => c.caseId === 'mcp-start-quest',
    );

    expect(hasStartQuest).toBe(false);
  });

  it('VALID: {signals} => case IDs list matches the complete/done/partial signal set', () => {
    expect(smoketestCaseCatalogStatics.signals.map((c) => c.caseId).sort()).toStrictEqual(
      ['signal-complete', 'signal-done', 'signal-partial'].sort(),
    );
  });

  it('VALID: {signals} => every entry expects the complete signal (the sole signal kind)', () => {
    expect(smoketestCaseCatalogStatics.signals.map((c) => c.expectedSignal)).toStrictEqual([
      'complete',
      'complete',
      'complete',
    ]);
  });

  it('VALID: {orchestration} => references the 5 scenarios from smoketestScenariosStatics', () => {
    expect(smoketestCaseCatalogStatics.orchestration.map((c) => c.caseId).sort()).toStrictEqual(
      [
        'orch-codeweaver-partial',
        'orch-happy-path',
        'orch-reaches-blightwarden',
        'orch-reaches-flowrider',
        'orch-reaches-lawbringer',
      ].sort(),
    );
  });

  it('VALID: {orchestration entries} => carry full scenario shape with blueprint/scripts/assertions', () => {
    const shapes = smoketestCaseCatalogStatics.orchestration.map((scenario) => ({
      hasBlueprint: typeof scenario.blueprint === 'object',
      hasScripts: typeof scenario.scripts === 'object',
      hasAssertions: Array.isArray(scenario.assertions),
    }));

    expect(shapes).toStrictEqual([
      { hasBlueprint: true, hasScripts: true, hasAssertions: true },
      { hasBlueprint: true, hasScripts: true, hasAssertions: true },
      { hasBlueprint: true, hasScripts: true, hasAssertions: true },
      { hasBlueprint: true, hasScripts: true, hasAssertions: true },
      { hasBlueprint: true, hasScripts: true, hasAssertions: true },
    ]);
  });
});
