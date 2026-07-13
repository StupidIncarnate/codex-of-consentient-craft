import { smoketestBlueprintsStatics } from './smoketest-blueprints-statics';

describe('smoketestBlueprintsStatics', () => {
  it('VALID: {minimal} => exposes every field the hydrator walk requires', () => {
    expect({
      hasTitle: smoketestBlueprintsStatics.minimal.title.length > 0,
      hasUserRequest: smoketestBlueprintsStatics.minimal.userRequest.length > 0,
      flowCount: smoketestBlueprintsStatics.minimal.flows.length,
      designDecisionCount: smoketestBlueprintsStatics.minimal.designDecisions.length,
      contractCount: smoketestBlueprintsStatics.minimal.contracts.length,
      operationCount: smoketestBlueprintsStatics.minimal.operations.length,
      skipRoles: smoketestBlueprintsStatics.minimal.skipRoles,
    }).toStrictEqual({
      hasTitle: true,
      hasUserRequest: true,
      flowCount: 1,
      designDecisionCount: 1,
      contractCount: 1,
      operationCount: 1,
      skipRoles: ['ward'],
    });
  });

  it('VALID: {minimal.operations[0]} => single codeweaver operation item satisfies the approved gate', () => {
    const [operation] = smoketestBlueprintsStatics.minimal.operations;

    expect(operation).toStrictEqual({
      id: '00000000-0000-4000-8000-00000000c0de',
      role: 'codeweaver',
      text: 'Smoketest: implement the single-flow signal emitter',
      status: 'pending',
      locked: false,
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

  it('VALID: {minimal signal flow} => terminal node carries the scripted signal-back observable', () => {
    const { minimal } = smoketestBlueprintsStatics;
    const signalFlow = minimal.flows.find((flow) => flow.id === 'smoketest-signal-flow');
    const terminalNode = signalFlow?.nodes.find((node) => node.type === 'terminal');
    const signalReceivedObservable = terminalNode?.observables.find(
      (obs) => obs.id === 'smoketest-signal-received',
    );

    expect({
      terminalNodeId: terminalNode?.id,
      terminalNodeLabel: terminalNode?.label,
      terminalObservableType: signalReceivedObservable?.type,
      terminalObservableDescription: signalReceivedObservable?.description,
    }).toStrictEqual({
      terminalNodeId: 'emit-signal',
      terminalNodeLabel: 'Agent emits signal-back',
      terminalObservableType: 'log-output',
      terminalObservableDescription:
        'Agent stream includes exactly one mcp__dungeonmaster__signal-back tool-use with the scripted signal',
    });
  });
});
