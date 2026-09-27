import { ConsoleStub } from './console.stub';

describe('ConsoleStub', () => {
  it('VALID: {} => is the same real console object the environment provides', () => {
    expect(ConsoleStub()).toBe(globalThis.console);
  });
});
