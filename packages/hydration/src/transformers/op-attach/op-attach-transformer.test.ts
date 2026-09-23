import { opAttachTransformer } from './op-attach-transformer';
import { IngredientNameStub } from '../../contracts/ingredient-name/ingredient-name.stub';
import { CallIndexStub } from '../../contracts/call-index/call-index.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';

describe('opAttachTransformer', () => {
  it('VALID: {ingredient: quest, callIndex: 0, ancestors: []} => returns the whole attach op, deriving a top-level ref at index 0', () => {
    const result = opAttachTransformer({
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      ancestors: [],
      where: FieldValuesStub({ id: 'q1' }),
    });

    expect(result).toStrictEqual({
      op: 'attach',
      ingredient: 'quest',
      ref: 'quest[0:0]',
      ancestors: [],
      where: { id: 'q1' },
    });
  });

  it('VALID: {ancestors: [guild[0:0]]} => derives a ref nested under its immediate host', () => {
    const result = opAttachTransformer({
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 0 }),
      ancestors: [RowRefStub({ value: 'guild[0:0]' })],
      where: FieldValuesStub({ id: 'q1' }),
    });

    expect(result).toStrictEqual({
      op: 'attach',
      ingredient: 'quest',
      ref: 'guild[0:0]/quest[0:0]',
      ancestors: ['guild[0:0]'],
      where: { id: 'q1' },
    });
  });

  it('VALID: {callIndex: 1} => a second attach call on the same collection derives a distinct ref, always at row index 0', () => {
    const result = opAttachTransformer({
      ingredient: IngredientNameStub({ value: 'quest' }),
      callIndex: CallIndexStub({ value: 1 }),
      ancestors: [],
      where: FieldValuesStub({ id: 'q2' }),
    });

    expect(result).toStrictEqual({
      op: 'attach',
      ingredient: 'quest',
      ref: 'quest[1:0]',
      ancestors: [],
      where: { id: 'q2' },
    });
  });
});
