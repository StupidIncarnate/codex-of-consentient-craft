import { ExitCodeStub } from './exit-code.stub';

describe('exitCodeContract', () => {
  it('VALID: {value: 0} => parses successfully', () => {
    const result = ExitCodeStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('VALID: {value: 1} => parses successfully', () => {
    const result = ExitCodeStub({ value: 1 });

    expect(result).toBe(1);
  });

  it('VALID: {value: 255} => parses successfully', () => {
    const result = ExitCodeStub({ value: 255 });

    expect(result).toBe(255);
  });
});
