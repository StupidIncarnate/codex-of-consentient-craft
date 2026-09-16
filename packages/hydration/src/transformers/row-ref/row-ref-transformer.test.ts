import { rowRefTransformer } from './row-ref-transformer';
import { IngredientNameStub } from '../../contracts/ingredient-name/ingredient-name.stub';
import { CallIndexStub } from '../../contracts/call-index/call-index.stub';
import { RowIndexStub } from '../../contracts/row-index/row-index.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';

describe('rowRefTransformer', () => {
  it('VALID: {ancestors: [], ingredient: guild, callIndex: 0, index: 0} => returns "guild[0:0]"', () => {
    const result = rowRefTransformer({
      ancestors: [],
      ingredient: IngredientNameStub({ value: 'guild' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 0 }),
    });

    expect(result).toBe('guild[0:0]');
  });

  it('VALID: {ancestors: [guild[0:0]], ingredient: quest, callIndex: 0, index: 2} => returns "guild[0:0]/quest[0:2]"', () => {
    const result = rowRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 2 }),
    });

    expect(result).toBe('guild[0:0]/quest[0:2]');
  });

  it('VALID: {the same arguments twice} => returns the identical ref both times', () => {
    const first = rowRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 2 }),
    });
    const second = rowRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 2 }),
    });

    expect(first).toBe(second);
  });

  it('VALID: {two calls sharing ancestors, ingredient and index, differing only in callIndex} => returns two distinct refs', () => {
    const fromFirstCall = rowRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 0 }),
    });
    const fromSecondCall = rowRefTransformer({
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 1 }),
      index: RowIndexStub({ value: 0 }),
    });

    expect([fromFirstCall, fromSecondCall]).toStrictEqual([
      'guild[0:0]/quest[0:0]',
      'guild[0:0]/quest[1:0]',
    ]);
  });
});
