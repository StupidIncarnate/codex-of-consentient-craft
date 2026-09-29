import { Node } from './Node';
import { NodeStub } from './node.stub';

describe('NodeStub', () => {
  it('VALID: {given fields} => a real Node carrying them', () => {
    const node = NodeStub({ data: 'abc' });

    expect({
      isNode: node instanceof Node,
      nodeType: node.nodeType,
      text: node.textContent,
    }).toStrictEqual({ isNode: true, nodeType: Node.COMMENT_NODE, text: 'abc' });
  });

  it('VALID: {} => the documented defaults', () => {
    const node = NodeStub();

    expect(node.textContent).toBe('a note');
  });
});
