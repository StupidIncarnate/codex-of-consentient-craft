import { ResizeObserverStub } from './resize-observer.stub';

describe('ResizeObserverStub', () => {
  it('VALID: {} => a real ResizeObserver instance with the observe/unobserve/disconnect API', () => {
    const observer = ResizeObserverStub();

    expect({
      isResizeObserver: observer instanceof ResizeObserver,
      hasObserve: typeof observer.observe,
      hasUnobserve: typeof observer.unobserve,
      hasDisconnect: typeof observer.disconnect,
    }).toStrictEqual({
      isResizeObserver: true,
      hasObserve: 'function',
      hasUnobserve: 'function',
      hasDisconnect: 'function',
    });
  });
});
