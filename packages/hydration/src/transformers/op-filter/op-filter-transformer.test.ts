import { opFilterTransformer } from './op-filter-transformer';
import { IngredientNameStub } from '../../contracts/ingredient-name/ingredient-name.stub';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';
import { OpRemoveStub } from '../../contracts/op-remove/op-remove.stub';

describe('opFilterTransformer', () => {
  it('VALID: {scoped filter, expect one, one nested remove} => returns the whole filter op with a scoped matchedRef', () => {
    const result = opFilterTransformer({
      ingredient: IngredientNameStub({ value: 'operation' }),
      scope: RowRefStub({ value: 'guild[0:0]/quest[0:0]' }),
      where: FieldValuesStub({ role: 'riftcarver' }),
      expect: 'one',
      ops: [OpRemoveStub({ ref: 'guild[0:0]/quest[0:0]/operation[match]' })],
    });

    expect(result).toStrictEqual({
      op: 'filter',
      ingredient: 'operation',
      scope: 'guild[0:0]/quest[0:0]',
      where: { role: 'riftcarver' },
      expect: 'one',
      matchedRef: 'guild[0:0]/quest[0:0]/operation[match]',
      ops: [{ op: 'remove', ref: 'guild[0:0]/quest[0:0]/operation[match]' }],
    });
  });

  it('VALID: {expect omitted, no scope} => defaults expect to "some" and carries no scope key', () => {
    const result = opFilterTransformer({
      ingredient: IngredientNameStub({ value: 'operation' }),
      where: FieldValuesStub({ role: 'ward' }),
      ops: [],
    });

    expect(result).toStrictEqual({
      op: 'filter',
      ingredient: 'operation',
      where: { role: 'ward' },
      expect: 'some',
      matchedRef: 'operation[match]',
      ops: [],
    });
  });

  it('VALID: {an add-created row and a same-scope filter placeholder} => the two refs are distinct strings', () => {
    const { matchedRef } = opFilterTransformer({
      ingredient: IngredientNameStub({ value: 'operation' }),
      scope: RowRefStub({ value: 'guild[0:0]/quest[0:0]' }),
      where: FieldValuesStub({ role: 'riftcarver' }),
      ops: [],
    });
    const realRowRef = RowRefStub({ value: 'guild[0:0]/quest[0:0]/operation[0:0]' });

    expect([matchedRef, realRowRef]).toStrictEqual([
      'guild[0:0]/quest[0:0]/operation[match]',
      'guild[0:0]/quest[0:0]/operation[0:0]',
    ]);
  });
});
