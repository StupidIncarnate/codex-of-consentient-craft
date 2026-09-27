import { WindowStub } from './window.stub';

describe('WindowStub', () => {
  it('VALID: {} => is the same real window object the environment provides', () => {
    expect(WindowStub()).toBe(globalThis.window);
  });
});
