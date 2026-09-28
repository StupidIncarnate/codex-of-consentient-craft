import { MockFunctionStub } from './mock-function.stub';

describe('MockFunctionStub', () => {
  it('VALID: {} => a real jest mock function that tracks its own calls', () => {
    const handler = MockFunctionStub();
    handler.mockReturnValue('staged');

    const result = handler('input');

    expect(result).toBe('staged');
    expect(handler.mock.calls).toStrictEqual([['input']]);
  });
});
