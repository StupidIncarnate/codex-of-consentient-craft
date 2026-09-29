import { CallToolResultStub } from './call-tool-result.stub';

describe('CallToolResultStub', () => {
  it('VALID: {} => a real successful text result', () => {
    expect(CallToolResultStub()).toStrictEqual({
      content: [{ type: 'text', text: 'gateway-stub-result' }],
      isError: false,
    });
  });

  it('VALID: {text, isError} => reflects the given result', () => {
    expect(CallToolResultStub({ text: 'boom', isError: true })).toStrictEqual({
      content: [{ type: 'text', text: 'boom' }],
      isError: true,
    });
  });
});
