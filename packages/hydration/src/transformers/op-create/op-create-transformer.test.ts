import { opCreateTransformer } from './op-create-transformer';
import { IngredientNameStub } from '../../contracts/ingredient-name/ingredient-name.stub';
import { CallIndexStub } from '../../contracts/call-index/call-index.stub';
import { RowIndexStub } from '../../contracts/row-index/row-index.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';

describe('opCreateTransformer', () => {
  it('VALID: {ingredient: quest, callIndex: 0, index: 1, ancestors: [guild[0:0]]} => returns the whole create op, deriving ref', () => {
    const result = opCreateTransformer({
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 1 }),
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      fields: FieldValuesStub({ title: 'The running one' }),
    });

    expect(result).toStrictEqual({
      op: 'create',
      ingredient: 'quest',
      ref: 'guild[0:0]/quest[0:1]',
      index: 1,
      ancestors: ['guild[0:0]'],
      fields: { title: 'The running one' },
    });
  });

  it('VALID: {ancestors: []} => derives a top-level ref with no ancestor segment', () => {
    const result = opCreateTransformer({
      ingredient: IngredientNameStub({ value: 'guild' }),
      callIndex: CallIndexStub({ value: 0 }),
      index: RowIndexStub({ value: 0 }),
      ancestors: [],
      fields: FieldValuesStub({ name: 'Siege' }),
    });

    expect(result).toStrictEqual({
      op: 'create',
      ingredient: 'guild',
      ref: 'guild[0:0]',
      index: 0,
      ancestors: [],
      fields: { name: 'Siege' },
    });
  });

  it('VALID: {ingredient: quest, callIndex: 1, index: 0, ancestors: [guild[0:0]]} => a second call on the same collection derives a distinct ref', () => {
    const result = opCreateTransformer({
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 1 }),
      index: RowIndexStub({ value: 0 }),
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      fields: FieldValuesStub({ title: 'Quest 1' }),
    });

    expect(result).toStrictEqual({
      op: 'create',
      ingredient: 'quest',
      ref: 'guild[0:0]/quest[1:0]',
      index: 0,
      ancestors: ['guild[0:0]'],
      fields: { title: 'Quest 1' },
    });
  });
});
