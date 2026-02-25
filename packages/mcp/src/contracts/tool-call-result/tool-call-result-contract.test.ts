import { toolCallResultContract as _toolCallResultContract } from './tool-call-result-contract';
import { ToolCallResultStub } from './tool-call-result.stub';

describe('toolCallResultContract', () => {
  it('VALID: {content: []} => parses successfully', () => {
    const result = ToolCallResultStub({ content: [] });

    expect(result).toStrictEqual({
      content: [],
    });
  });

  it('VALID: {content: [{type: "text", text: "Result"}]} => parses successfully', () => {
    const result = ToolCallResultStub({
      content: [{ type: 'text', text: 'Result' }],
    });

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Result' }],
    });
  });

  it('VALID: {content: [{...}, {...}]} => parses successfully with multiple content items', () => {
    const result = ToolCallResultStub({
      content: [
        { type: 'text', text: 'First result' },
        { type: 'text', text: 'Second result' },
      ],
    });

    expect(result).toStrictEqual({
      content: [
        { type: 'text', text: 'First result' },
        { type: 'text', text: 'Second result' },
      ],
    });
  });

  it('VALID: {content: [...], isError: true} => parses successfully with isError flag', () => {
    const result = ToolCallResultStub({
      content: [{ type: 'text', text: 'Error occurred' }],
      isError: true,
    });

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Error occurred' }],
      isError: true,
    });
  });

  it('VALID: {content: [...]} => parses without isError when omitted', () => {
    const result = ToolCallResultStub({
      content: [{ type: 'text', text: 'Success' }],
    });

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Success' }],
    });
  });
});
