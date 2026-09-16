import { rowRefContract } from './row-ref-contract';
import { RowRefStub } from './row-ref.stub';
import { IngredientNameStub } from '../ingredient-name/ingredient-name.stub';

describe('rowRefContract', () => {
  describe('valid row refs', () => {
    it('VALID: {value: "guild[0]"} => returns "guild[0]"', () => {
      expect(RowRefStub({ value: 'guild[0]' })).toBe('guild[0]');
    });

    it('VALID: {value: "guild[0]/quest[2]"} => returns "guild[0]/quest[2]"', () => {
      expect(RowRefStub({ value: 'guild[0]/quest[2]' })).toBe('guild[0]/quest[2]');
    });
  });

  describe('agreement with ingredientNameContract', () => {
    it('VALID: {value: a hyphenated ingredient name} => the RowRef built from it still parses', () => {
      const name = IngredientNameStub({ value: 'work-item' });

      expect(RowRefStub({ value: `${name}[0]` })).toBe('work-item[0]');
    });
  });

  describe('invalid row refs', () => {
    it("INVALID: {value: 'quest'} => throws \"must be an ancestor path like 'guild[0]/quest[2]'\"", () => {
      expect(() => rowRefContract.parse('quest')).toThrow(
        /must be an ancestor path like 'guild\[0\]\/quest\[2\]'/u,
      );
    });
  });
});
