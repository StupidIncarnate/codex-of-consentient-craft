import { toolUseIdContract } from './tool-use-id-contract';
import { ToolUseIdStub } from './tool-use-id.stub';

describe('toolUseIdContract', () => {
  it('VALID: {non-empty string} => parses to branded ToolUseId', () => {
    const result = toolUseIdContract.parse('toolu_01B3VQHjYXB5Wap7jrw1T3uS');

    expect(result).toBe(ToolUseIdStub({ value: 'toolu_01B3VQHjYXB5Wap7jrw1T3uS' }));
  });

  it('INVALID: {empty string} => throws', () => {
    expect(() => toolUseIdContract.parse('')).toThrow(/String must contain at least 1/u);
  });

  it('INVALID: {non-string} => throws', () => {
    expect(() => toolUseIdContract.parse(123)).toThrow(/Expected string/u);
  });
});
