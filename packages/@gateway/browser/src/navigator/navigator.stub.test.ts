import { NavigatorStub } from './navigator.stub';

describe('NavigatorStub', () => {
  it('VALID: {} => is the same real navigator object the environment provides', () => {
    expect(NavigatorStub()).toBe(globalThis.navigator);
  });
});
