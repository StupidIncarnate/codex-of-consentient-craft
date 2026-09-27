import { MemoryRouterStub } from './memory-router.stub';

describe('MemoryRouterStub', () => {
  it('VALID: {} => a real router whose real initial state is at the root path', () => {
    const router = MemoryRouterStub();

    expect(router.state.location.pathname).toBe('/');
  });
});
