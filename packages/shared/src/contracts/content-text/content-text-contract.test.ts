import { contentTextContract } from './content-text-contract';
import { ContentTextStub } from './content-text.stub';

describe('contentTextContract', () => {
  it('VALID: {value: "Result text"} => parses successfully', () => {
    const result = ContentTextStub({ value: 'Result text' });

    expect(result).toBe('Result text');
  });

  it('VALID: {value: ""} => parses empty string successfully', () => {
    const result = ContentTextStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: multiline} => parses multiline string successfully', () => {
    const multiline = `Line 1
Line 2
Line 3`;
    const result = ContentTextStub({ value: multiline });

    expect(result).toBe(multiline);
  });

  it('VALID: contract is defined', () => {
    expect(contentTextContract).toBeDefined();
  });
});
