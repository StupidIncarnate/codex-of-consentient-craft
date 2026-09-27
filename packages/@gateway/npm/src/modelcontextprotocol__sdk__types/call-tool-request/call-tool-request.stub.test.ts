import { CallToolRequestStub } from './call-tool-request.stub';

describe('CallToolRequestStub', () => {
  it('VALID: {} => a real, schema-validated request for the default tool', () => {
    const request = CallToolRequestStub();

    expect(request).toStrictEqual({
      method: 'tools/call',
      params: { name: 'gateway-stub-tool', arguments: { key: 'value' } },
    });
  });

  it('VALID: {name, args} => reflects the given tool call', () => {
    const request = CallToolRequestStub({ name: 'other-tool', args: { a: 1 } });

    expect(request).toStrictEqual({
      method: 'tools/call',
      params: { name: 'other-tool', arguments: { a: 1 } },
    });
  });
});
