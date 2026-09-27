import { LocationStub } from './location.stub';

describe('LocationStub', () => {
  it('VALID: {} => is the same real location object the environment provides', () => {
    expect(LocationStub()).toBe(globalThis.location);
  });
});
