import { matchedRefTransformer } from './matched-ref-transformer';
import { rowRefTransformer } from '../row-ref/row-ref-transformer';
import { IngredientNameStub } from '../../contracts/ingredient-name/ingredient-name.stub';
import { CallIndexStub } from '../../contracts/call-index/call-index.stub';
import { RowIndexStub } from '../../contracts/row-index/row-index.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';

describe('matchedRefTransformer', () => {
  it('VALID: {ancestors: [], ingredient: operation} => returns "operation[match]"', () => {
    const result = matchedRefTransformer({
      ancestors: [],
      ingredient: IngredientNameStub({ value: 'operation' }),
    });

    expect(result).toBe('operation[match]');
  });

  it('VALID: {ancestors: [guild[0:0]/quest[0:0]], ingredient: operation} => returns "guild[0:0]/quest[0:0]/operation[match]"', () => {
    const result = matchedRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]/quest[0:0]' })],
      ingredient: IngredientNameStub({ value: 'operation' }),
    });

    expect(result).toBe('guild[0:0]/quest[0:0]/operation[match]');
  });

  it('VALID: {two calls sharing an ancestor and an ingredient} => returns the identical placeholder both times', () => {
    const first = matchedRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
    });
    const second = matchedRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
    });

    expect(first).toBe(second);
  });

  it('VALID: {a filter placeholder and a real add-created row at the same ancestors, ingredient and index} => the two refs differ', () => {
    const placeholder = matchedRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
    });
    const realRow = rowRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 0 }),
    });

    expect([placeholder, realRow]).toStrictEqual([
      'guild[0:0]/quest[match]',
      'guild[0:0]/quest[0:0]',
    ]);
  });
});
