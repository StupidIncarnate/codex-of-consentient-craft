import { rowRefIngredientTransformer } from './row-ref-ingredient-transformer';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';

describe('rowRefIngredientTransformer', () => {
  describe('a single-segment ref', () => {
    it('VALID: {rowRef: "guild[0:0]"} => returns "guild"', () => {
      const result = rowRefIngredientTransformer({ rowRef: RowRefStub({ value: 'guild[0:0]' }) });

      expect(result).toBe('guild');
    });
  });

  describe('a two-segment ref', () => {
    it('VALID: {rowRef: "guild[0:0]/quest[0:2]"} => returns "quest"', () => {
      const result = rowRefIngredientTransformer({
        rowRef: RowRefStub({ value: 'guild[0:0]/quest[0:2]' }),
      });

      expect(result).toBe('quest');
    });
  });

  describe('a three-segment ref with a two-digit row index', () => {
    it('VALID: {rowRef: "guild[0:0]/quest[0:2]/operation[0:11]"} => returns "operation"', () => {
      const result = rowRefIngredientTransformer({
        rowRef: RowRefStub({ value: 'guild[0:0]/quest[0:2]/operation[0:11]' }),
      });

      expect(result).toBe('operation');
    });
  });

  describe('a ref ending in a filter placeholder segment', () => {
    it('VALID: {rowRef: "guild[0:0]/quest[0:0]/operation[match]"} => returns "operation"', () => {
      const result = rowRefIngredientTransformer({
        rowRef: RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[match]' }),
      });

      expect(result).toBe('operation');
    });
  });
});
