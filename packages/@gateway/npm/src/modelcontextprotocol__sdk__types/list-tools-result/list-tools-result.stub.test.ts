import { ListToolsResultStub } from './list-tools-result.stub';

describe('ListToolsResultStub', () => {
  it('VALID: {} => a real result with the default tool', () => {
    expect(ListToolsResultStub()).toStrictEqual({
      tools: [{ name: 'gateway-stub-tool', inputSchema: { type: 'object' } }],
    });
  });

  it('VALID: {names} => one real tool per name', () => {
    expect(ListToolsResultStub({ names: ['a', 'b'] }).tools.map((tool) => tool.name)).toStrictEqual(
      ['a', 'b'],
    );
  });
});
