/**
 * No-op proxy for busEventLinesRenderLayerBroker — the implementation is a pure
 * transform with no I/O dependencies, so there's nothing to mock. Test scaffolding
 * still calls the proxy factory before the implementation per the harness rule.
 */

export const busEventLinesRenderLayerBrokerProxy = (): {
  setup: () => void;
} => ({
  setup: (): void => {
    // intentionally empty — no I/O to stub
  },
});
