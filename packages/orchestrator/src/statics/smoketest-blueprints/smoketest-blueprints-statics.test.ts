import { smoketestBlueprintsStatics } from './smoketest-blueprints-statics';

describe('smoketestBlueprintsStatics', () => {
  it('VALID: {minimal} => exposes every field the hydrator walk requires', () => {
    expect({
      hasTitle: smoketestBlueprintsStatics.minimal.title.length > 0,
      hasUserRequest: smoketestBlueprintsStatics.minimal.userRequest.length > 0,
      flowCount: smoketestBlueprintsStatics.minimal.flows.length,
      designDecisionCount: smoketestBlueprintsStatics.minimal.designDecisions.length,
      contractCount: smoketestBlueprintsStatics.minimal.contracts.length,
      stepCount: smoketestBlueprintsStatics.minimal.steps.length,
      surfaceReportCount: smoketestBlueprintsStatics.minimal.planningNotes.surfaceReports.length,
      reviewReportSignal: smoketestBlueprintsStatics.minimal.planningNotes.reviewReport.signal,
      skipRoles: smoketestBlueprintsStatics.minimal.skipRoles,
    }).toStrictEqual({
      hasTitle: true,
      hasUserRequest: true,
      flowCount: 1,
      designDecisionCount: 1,
      contractCount: 1,
      stepCount: 1,
      surfaceReportCount: 1,
      reviewReportSignal: 'clean',
      skipRoles: ['ward'],
    });
  });

  it('VALID: {minimal.planningNotes} => every planningNotes sub-field required for seek_plan gate is defined', () => {
    const { planningNotes } = smoketestBlueprintsStatics.minimal;

    expect({
      scopeClassificationKeys: Object.keys(planningNotes.scopeClassification).sort(),
      synthesisKeys: Object.keys(planningNotes.synthesis).sort(),
      walkFindingsKeys: Object.keys(planningNotes.walkFindings).sort(),
      reviewReportKeys: Object.keys(planningNotes.reviewReport).sort(),
    }).toStrictEqual({
      scopeClassificationKeys: ['classifiedAt', 'rationale', 'size', 'slicing'],
      synthesisKeys: [
        'claudemdRulesInEffect',
        'crossSliceResolutions',
        'openAssumptions',
        'orderOfOperations',
        'synthesizedAt',
      ],
      walkFindingsKeys: ['filesRead', 'planPatches', 'structuralIssuesFound', 'verifiedAt'],
      reviewReportKeys: ['criticalItems', 'info', 'rawReport', 'reviewedAt', 'signal', 'warnings'],
    });
  });

  it('VALID: {minimal.flows} => every terminal flow node has at least one observable', () => {
    const terminalNodes = smoketestBlueprintsStatics.minimal.flows.flatMap((flow) =>
      flow.nodes.filter((node) => node.type === 'terminal'),
    );
    const terminalObservables = terminalNodes.flatMap((node) => node.observables);

    expect({
      terminalCount: terminalNodes.length,
      observableCount: terminalObservables.length,
    }).toStrictEqual({
      terminalCount: 1,
      observableCount: 1,
    });
  });

  it('VALID: {orchestrator dispatches scripted agent} => Agent emits scripted signal-back signal exactly once', () => {
    const { minimal } = smoketestBlueprintsStatics;
    const emitSignalStep = minimal.steps.find((step) => step.id === 'smoketest-emit-signal-step');
    const signalFlow = minimal.flows.find((flow) => flow.id === 'smoketest-signal-flow');
    const terminalNode = signalFlow?.nodes.find((node) => node.type === 'terminal');
    const signalReceivedObservable = terminalNode?.observables.find(
      (obs) => obs.id === 'smoketest-signal-received',
    );

    expect({
      stepCount: minimal.steps.length,
      stepId: emitSignalStep?.id,
      stepObservablesSatisfied: emitSignalStep?.observablesSatisfied,
      terminalNodeId: terminalNode?.id,
      terminalNodeLabel: terminalNode?.label,
      terminalObservableType: signalReceivedObservable?.type,
      terminalObservableDescription: signalReceivedObservable?.description,
    }).toStrictEqual({
      stepCount: 1,
      stepId: 'smoketest-emit-signal-step',
      stepObservablesSatisfied: ['smoketest-signal-received'],
      terminalNodeId: 'emit-signal',
      terminalNodeLabel: 'Agent emits signal-back',
      terminalObservableType: 'log-output',
      terminalObservableDescription:
        'Agent stream includes exactly one mcp__dungeonmaster__signal-back tool-use with the scripted signal',
    });
  });
});
