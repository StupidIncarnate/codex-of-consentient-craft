import { opSetTransformer } from './op-set-transformer';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';
import { TransitionSpecStub } from '../../contracts/transition-spec/transition-spec.stub';

describe('opSetTransformer', () => {
  it('VALID: {status: in_progress, title: The running one} with transitions on status => splits written from transition', () => {
    const result = opSetTransformer({
      ref: RowRefStub({ value: 'guild[0:0]/quest[0:2]' }),
      values: FieldValuesStub({ status: 'in_progress', title: 'The running one' }),
      transitions: TransitionSpecStub({ field: 'status', to: ['created', 'in_progress'] }),
    });

    expect(result).toStrictEqual({
      op: 'set',
      ref: 'guild[0:0]/quest[0:2]',
      written: { title: 'The running one' },
      transition: { field: 'status', to: 'in_progress' },
    });
  });

  it('VALID: {transitions omitted} => writes every field and carries no transition key', () => {
    const result = opSetTransformer({
      ref: RowRefStub({ value: 'guild[0:0]/quest[0:2]' }),
      values: FieldValuesStub({ title: 'plain field, written' }),
    });

    expect(result).toStrictEqual({
      op: 'set',
      ref: 'guild[0:0]/quest[0:2]',
      written: { title: 'plain field, written' },
    });
  });

  it('VALID: {transitions declared but the walked field is absent from values} => writes every field and carries no transition key', () => {
    const result = opSetTransformer({
      ref: RowRefStub({ value: 'guild[0:0]/quest[0:2]' }),
      values: FieldValuesStub({ title: 'only the plain field' }),
      transitions: TransitionSpecStub({ field: 'status', to: ['created', 'in_progress'] }),
    });

    expect(result).toStrictEqual({
      op: 'set',
      ref: 'guild[0:0]/quest[0:2]',
      written: { title: 'only the plain field' },
    });
  });
});
