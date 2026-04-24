// Proxy intentionally minimal — drain-once-layer-broker takes injected callbacks and
// does no I/O, so tests assemble jest.fn() deps inline rather than going through
// adapter mocks. The proxy is still required per enforce-proxy-patterns.
export const drainOnceLayerBrokerProxy = (): {
  reset: () => void;
} => ({
  reset: (): void =>
    // No shared state to reset — tests construct fresh jest.fn() deps per case.
    undefined,
});
