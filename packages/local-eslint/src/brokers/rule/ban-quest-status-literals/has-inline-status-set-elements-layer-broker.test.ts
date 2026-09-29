import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { hasInlineStatusSetElementsLayerBrokerProxy } from './has-inline-status-set-elements-layer-broker.proxy';

describe('hasInlineStatusSetElementsLayerBroker', () => {
  describe('missing elements', () => {
    it('EMPTY: {} => returns false', () => {
      const proxy = hasInlineStatusSetElementsLayerBrokerProxy();

      expect(proxy.hasInlineStatusSetElementsLayerBroker({})).toBe(false);
    });

    it('EMPTY: {elements: []} => returns false', () => {
      const proxy = hasInlineStatusSetElementsLayerBrokerProxy();

      expect(proxy.hasInlineStatusSetElementsLayerBroker({ elements: [] })).toBe(false);
    });
  });

  describe('below the minimum threshold (1 known literal)', () => {
    it('EMPTY: {elements: ["in_progress"]} => returns false', () => {
      const proxy = hasInlineStatusSetElementsLayerBrokerProxy();

      expect(
        proxy.hasInlineStatusSetElementsLayerBroker({
          elements: [LiteralStub({ code: 'const l = "in_progress";' })],
        }),
      ).toBe(false);
    });
  });

  describe('at or above the minimum threshold (>= 2 known literals)', () => {
    it('VALID: {elements: ["in_progress", "complete"]} => returns true', () => {
      const proxy = hasInlineStatusSetElementsLayerBrokerProxy();

      expect(
        proxy.hasInlineStatusSetElementsLayerBroker({
          elements: [
            LiteralStub({ code: 'const l = "in_progress";' }),
            LiteralStub({ code: 'const l = "complete";' }),
          ],
        }),
      ).toBe(true);
    });

    it('VALID: 3 status literals + 1 non-status literal => returns true', () => {
      const proxy = hasInlineStatusSetElementsLayerBrokerProxy();

      expect(
        proxy.hasInlineStatusSetElementsLayerBroker({
          elements: [
            LiteralStub({ code: 'const l = "explore_flows";' }),
            LiteralStub({ code: 'const l = "review_flows";' }),
            LiteralStub({ code: 'const l = "flows_approved";' }),
            LiteralStub({ code: 'const l = "hello";' }),
          ],
        }),
      ).toBe(true);
    });
  });

  describe('non-status strings', () => {
    it('EMPTY: {elements: ["hello", "world"]} => returns false', () => {
      const proxy = hasInlineStatusSetElementsLayerBrokerProxy();

      expect(
        proxy.hasInlineStatusSetElementsLayerBroker({
          elements: [
            LiteralStub({ code: 'const l = "hello";' }),
            LiteralStub({ code: 'const l = "world";' }),
          ],
        }),
      ).toBe(false);
    });
  });
});
