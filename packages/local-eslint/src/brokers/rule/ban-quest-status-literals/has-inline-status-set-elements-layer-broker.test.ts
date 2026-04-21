import { hasInlineStatusSetElementsLayerBrokerProxy } from './has-inline-status-set-elements-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '@dungeonmaster/eslint-plugin';

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
          elements: [TsestreeStub({ type: TsestreeNodeType.Literal, value: 'in_progress' })],
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
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'in_progress' }),
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'complete' }),
          ],
        }),
      ).toBe(true);
    });

    it('VALID: 3 status literals + 1 non-status literal => returns true', () => {
      const proxy = hasInlineStatusSetElementsLayerBrokerProxy();

      expect(
        proxy.hasInlineStatusSetElementsLayerBroker({
          elements: [
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'seek_scope' }),
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'seek_synth' }),
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'seek_walk' }),
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'hello' }),
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
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'hello' }),
            TsestreeStub({ type: TsestreeNodeType.Literal, value: 'world' }),
          ],
        }),
      ).toBe(false);
    });
  });
});
