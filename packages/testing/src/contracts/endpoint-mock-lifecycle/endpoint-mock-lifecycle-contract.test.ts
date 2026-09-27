import { endpointMockLifecycleContract } from './endpoint-mock-lifecycle-contract';
import { EndpointMockLifecycleStub } from './endpoint-mock-lifecycle.stub';

describe('endpointMockLifecycleContract', () => {
  describe('valid lifecycle', () => {
    it('VALID: {default stub} => creates lifecycle with listen, resetHandlers, close', () => {
      const lifecycle = EndpointMockLifecycleStub();
      const parsed = endpointMockLifecycleContract.parse(lifecycle);

      expect(parsed).toStrictEqual({});
      expect(lifecycle).toStrictEqual({
        listen: expect.any(Function),
        resetHandlers: expect.any(Function),
        close: expect.any(Function),
        assertNoUnhandledRequests: expect.any(Function),
      });
    });

    it('VALID: {custom functions} => preserves function references', () => {
      const mockListen = jest.fn();
      const mockReset = jest.fn();
      const mockClose = jest.fn();
      const mockAssertNoUnhandledRequests = jest.fn();

      const lifecycle = EndpointMockLifecycleStub({
        listen: mockListen,
        resetHandlers: mockReset,
        close: mockClose,
        assertNoUnhandledRequests: mockAssertNoUnhandledRequests,
      });

      lifecycle.listen();
      lifecycle.resetHandlers();
      lifecycle.close();
      lifecycle.assertNoUnhandledRequests();

      expect(mockListen).toHaveBeenNthCalledWith(1);
      expect(mockReset).toHaveBeenNthCalledWith(1);
      expect(mockClose).toHaveBeenNthCalledWith(1);
      expect(mockAssertNoUnhandledRequests).toHaveBeenNthCalledWith(1);
    });
  });
});
