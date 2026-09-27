import { ElkLayoutResultStub } from './elk-layout-result.stub';

describe('ElkLayoutResultStub', () => {
  it('VALID: {} => real, computed positions for the default two-node graph', async () => {
    const laidOut = await ElkLayoutResultStub();

    expect(laidOut).toStrictEqual({
      root: { id: 'gateway-stub-root', width: 44, height: 84 },
      children: [
        { id: 'gateway-stub-node-1', x: 12, y: 12 },
        { id: 'gateway-stub-node-2', x: 12, y: 52 },
      ],
    });
  });

  it('VALID: {id, children} => reflects the given graph', async () => {
    const laidOut = await ElkLayoutResultStub({
      id: 'other-root',
      children: [{ id: 'solo', width: 5, height: 5 }],
    });

    expect({ id: laidOut.root.id, childCount: laidOut.children.length }).toStrictEqual({
      id: 'other-root',
      childCount: 1,
    });
  });
});
