import { opSetRawTransformer } from './op-set-raw-transformer';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';

describe('opSetRawTransformer', () => {
  it('VALID: {status: complete} => writes the field and carries no transition key', () => {
    const result = opSetRawTransformer({
      ref: 'guild[0:0]/quest[0:2]',
      values: FieldValuesStub({ status: 'complete' }),
    });

    expect(result).toStrictEqual({
      op: 'set',
      ref: 'guild[0:0]/quest[0:2]',
      written: { status: 'complete' },
    });
  });
});
