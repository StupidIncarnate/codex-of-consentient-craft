import { JestMockFnStub } from './jest-mock-fn.stub';

describe('JestMockFnStub', () => {
  it('VALID: {} => a real jest-mock function that tracks its own calls', () => {
    const handler = JestMockFnStub();
    handler.mockReturnValue('staged');

    const result = handler('input');

    expect(result).toBe('staged');
    expect(handler.mock.calls).toStrictEqual([['input']]);
  });
});
