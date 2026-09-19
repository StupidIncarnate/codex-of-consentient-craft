import { SelectorStub } from '../../contracts/selector/selector.stub';
import { withinSelectorNormaliseTransformer } from './within-selector-normalise-transformer';

describe('withinSelectorNormaliseTransformer', () => {
  describe('a bare testId', () => {
    it("VALID: {within: 'SUBAGENT_CHAIN_HEADER'} => expands to the data-testid selector", () => {
      const result = withinSelectorNormaliseTransformer({
        within: SelectorStub({ value: 'SUBAGENT_CHAIN_HEADER' }),
      });

      expect(result).toBe('[data-testid="SUBAGENT_CHAIN_HEADER"]');
    });

    it("VALID: {within: 'subagent-chain-duration'} => a kebab-case testId expands too", () => {
      const result = withinSelectorNormaliseTransformer({
        within: SelectorStub({ value: 'subagent-chain-duration' }),
      });

      expect(result).toBe('[data-testid="subagent-chain-duration"]');
    });

    it("VALID: {within: 'GUILD_ITEM_f52cd546'} => a testId carrying digits expands", () => {
      const result = withinSelectorNormaliseTransformer({
        within: SelectorStub({ value: 'GUILD_ITEM_f52cd546' }),
      });

      expect(result).toBe('[data-testid="GUILD_ITEM_f52cd546"]');
    });
  });

  describe('an explicit selector', () => {
    it('VALID: {within: an attribute selector} => handed back untouched', () => {
      const result = withinSelectorNormaliseTransformer({
        within: SelectorStub({ value: '[data-testid="MAP_FRAME"]' }),
      });

      expect(result).toBe('[data-testid="MAP_FRAME"]');
    });

    it('VALID: {within: a class selector} => handed back untouched', () => {
      const result = withinSelectorNormaliseTransformer({
        within: SelectorStub({ value: '.mantine-Modal-body' }),
      });

      expect(result).toBe('.mantine-Modal-body');
    });

    it('VALID: {within: a descendant selector} => handed back untouched', () => {
      const result = withinSelectorNormaliseTransformer({
        within: SelectorStub({ value: '[data-testid="A"] [data-testid="B"]' }),
      });

      expect(result).toBe('[data-testid="A"] [data-testid="B"]');
    });

    it('VALID: {within: an id selector} => handed back untouched', () => {
      const result = withinSelectorNormaliseTransformer({
        within: SelectorStub({ value: '#root' }),
      });

      expect(result).toBe('#root');
    });
  });
});
