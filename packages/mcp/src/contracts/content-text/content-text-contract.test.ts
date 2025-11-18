import { contentTextContract as _contentTextContract } from './content-text-contract';
import { ContentTextStub } from './content-text.stub';

describe('contentTextContract', () => {
  it('VALID: {value: "Sample text"} => parses successfully', () => {
    const result = ContentTextStub({ value: 'Sample text' });

    expect(result).toBe('Sample text');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ContentTextStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "{\\"key\\": \\"value\\"}"} => parses successfully with JSON string', () => {
    const result = ContentTextStub({ value: '{"key": "value"}' });

    expect(result).toBe('{"key": "value"}');
  });
});
