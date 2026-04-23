import {
  FlowIdStub,
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
} from '@dungeonmaster/shared/contracts';

import { flowsStripObservablesTransformer } from './flows-strip-observables-transformer';

describe('flowsStripObservablesTransformer', () => {
  it('EMPTY: {flows: []} => returns empty array', () => {
    const result = flowsStripObservablesTransformer({ flows: [] });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {flow with observables in nodes} => returns flows with empty observables arrays', () => {
    const node = FlowNodeStub({ observables: [FlowObservableStub()] });
    const flow = FlowStub({ nodes: [node] });

    const result = flowsStripObservablesTransformer({ flows: [flow] });

    expect(result).toStrictEqual([
      {
        ...flow,
        nodes: [{ ...node, observables: [] }],
      },
    ]);
  });

  it('VALID: {multiple flows with observables} => every flow is stripped', () => {
    const flow1 = FlowStub({
      id: FlowIdStub({ value: 'flow-one' }),
      nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
    });
    const flow2 = FlowStub({
      id: FlowIdStub({ value: 'flow-two' }),
      nodes: [FlowNodeStub({ observables: [] })],
    });

    const result = flowsStripObservablesTransformer({ flows: [flow1, flow2] });

    expect(result).toStrictEqual([
      {
        ...flow1,
        nodes: flow1.nodes.map((n) => ({ ...n, observables: [] })),
      },
      {
        ...flow2,
        nodes: flow2.nodes.map((n) => ({ ...n, observables: [] })),
      },
    ]);
  });
});
