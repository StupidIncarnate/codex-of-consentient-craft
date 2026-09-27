import { toolCallParamsContract } from './tool-call-params-contract';
import { ToolCallParamsStub } from './tool-call-params.stub';

describe('toolCallParamsContract', () => {
  it('VALID: {args only} => parses without meta', () => {
    expect(toolCallParamsContract.parse(ToolCallParamsStub())).toStrictEqual({
      args: { glob: 'packages/*/src/**' },
    });
  });

  it('VALID: {args and meta} => keeps both', () => {
    expect(
      toolCallParamsContract.parse(
        ToolCallParamsStub({ meta: { 'claudecode/toolUseId': 'toolu_1' } }),
      ),
    ).toStrictEqual({
      args: { glob: 'packages/*/src/**' },
      meta: { 'claudecode/toolUseId': 'toolu_1' },
    });
  });

  it('INVALID: {args missing} => throws', () => {
    expect(() => toolCallParamsContract.parse({})).toThrow(/Required/u);
  });
});
