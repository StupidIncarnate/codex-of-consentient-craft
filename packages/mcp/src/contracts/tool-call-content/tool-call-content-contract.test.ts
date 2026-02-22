import { toolCallContentContract as _toolCallContentContract } from './tool-call-content-contract';
import { ToolCallContentStub } from './tool-call-content.stub';

describe('toolCallContentContract', () => {
  it('VALID: {type: "text", text: "Sample"} => parses successfully', () => {
    const result = ToolCallContentStub({ type: 'text', text: 'Sample' });

    expect(result).toStrictEqual({
      type: 'text',
      text: 'Sample',
    });
  });

  it('VALID: {type: "application/json", text: "{\\"data\\": []}"} => parses successfully', () => {
    const result = ToolCallContentStub({
      type: 'application/json',
      text: '{"data": []}',
    });

    expect(result).toStrictEqual({
      type: 'application/json',
      text: '{"data": []}',
    });
  });

  it('VALID: {type: "text", text: ""} => parses successfully with empty text', () => {
    const result = ToolCallContentStub({ type: 'text', text: '' });

    expect(result).toStrictEqual({
      type: 'text',
      text: '',
    });
  });
});
