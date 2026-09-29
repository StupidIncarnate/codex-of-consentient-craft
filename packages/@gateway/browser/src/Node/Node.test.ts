import { Node } from './Node';

describe('#gateway/browser/Node', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(Node).toBe(globalThis.Node);
  });
});
