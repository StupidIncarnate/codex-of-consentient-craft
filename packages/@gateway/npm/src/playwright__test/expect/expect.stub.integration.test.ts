import { ExpectStub } from './expect.stub';

describe('ExpectStub', () => {
  it('VALID: {} => the real @playwright/test expect, a real functioning matcher factory', () => {
    const realExpect = ExpectStub();

    expect(() => {
      realExpect(1).toBe(2);
    }).toThrow(
      /^expect\(received\)\.toBe\(expected\) \/\/ Object\.is equality\n\nExpected: 2\nReceived: 1$/u,
    );
  });
});
