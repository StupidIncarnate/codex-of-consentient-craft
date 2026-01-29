import { e2eScreenStateContract } from './e2e-screen-state-contract';
import { E2EScreenStateStub } from './e2e-screen-state.stub';

describe('e2eScreenStateContract', () => {
  it('VALID: {valid screen state} => parses successfully', () => {
    const result = e2eScreenStateContract.parse({
      name: 'menu',
      frame: 'terminal output',
      capturedAt: 1704067200000,
    });

    expect(result).toStrictEqual({
      name: 'menu',
      frame: 'terminal output',
      capturedAt: 1704067200000,
    });
  });

  it('INVALID: {invalid screen name} => throws ZodError', () => {
    expect(() =>
      e2eScreenStateContract.parse({
        name: 'invalid',
        frame: 'output',
        capturedAt: 1704067200000,
      }),
    ).toThrow('Invalid enum value');
  });

  it('INVALID: {negative timestamp} => throws ZodError', () => {
    expect(() =>
      e2eScreenStateContract.parse({
        name: 'menu',
        frame: 'output',
        capturedAt: -1,
      }),
    ).toThrow('Number must be greater than 0');
  });
});

describe('E2EScreenStateStub', () => {
  it('VALID: {no args} => returns default menu state', () => {
    const result = E2EScreenStateStub();

    expect(result).toStrictEqual({
      name: 'menu',
      frame: '┌──────────┐\n│  Menu    │\n└──────────┘',
      capturedAt: 1704067200000,
    });
  });

  it('VALID: {partial overrides} => merges with defaults', () => {
    const result = E2EScreenStateStub({ name: 'list' });

    expect(result).toStrictEqual({
      name: 'list',
      frame: '┌──────────┐\n│  Menu    │\n└──────────┘',
      capturedAt: 1704067200000,
    });
  });
});
