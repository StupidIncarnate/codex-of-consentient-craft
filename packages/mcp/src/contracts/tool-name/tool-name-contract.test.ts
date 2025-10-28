import { ToolNameStub } from './tool-name.stub';

describe('toolNameContract', () => {
  it('VALID: {value: "discover"} => parses successfully', () => {
    const result = ToolNameStub({ value: 'discover' });

    expect(result).toBe('discover');
  });

  it('VALID: {value: "search"} => parses successfully', () => {
    const result = ToolNameStub({ value: 'search' });

    expect(result).toBe('search');
  });

  it('VALID: {value: "analyze-code"} => parses successfully', () => {
    const result = ToolNameStub({ value: 'analyze-code' });

    expect(result).toBe('analyze-code');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ToolNameStub({ value: '' });

    expect(result).toBe('');
  });
});
