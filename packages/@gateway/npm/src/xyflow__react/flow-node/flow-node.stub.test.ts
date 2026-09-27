import { FlowNodeStub } from './flow-node.stub';

describe('FlowNodeStub', () => {
  it('VALID: {} => a complete Node with the default id and origin position', () => {
    expect(FlowNodeStub()).toStrictEqual({
      id: 'gateway-stub-node',
      position: { x: 0, y: 0 },
      data: {},
    });
  });

  it('VALID: {id, x, y} => reflects the given fields', () => {
    expect(FlowNodeStub({ id: 'n2', x: 10, y: 20 })).toStrictEqual({
      id: 'n2',
      position: { x: 10, y: 20 },
      data: {},
    });
  });
});
