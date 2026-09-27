import { ConsoleStub } from './console.stub';

describe('ConsoleStub', () => {
  it('VALID: {} => is the same object Node provides on globalThis', () => {
    expect(ConsoleStub()).toBe(globalThis.console);
  });
});
