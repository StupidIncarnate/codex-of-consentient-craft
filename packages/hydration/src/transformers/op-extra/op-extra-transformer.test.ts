import { opExtraTransformer } from './op-extra-transformer';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { ExtraVerbNameStub } from '../../contracts/extra-verb-name/extra-verb-name.stub';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';

describe('opExtraTransformer', () => {
  it('VALID: {ref: session[0:0], verb: withNestedChain, args: {depth: 2}} => returns the whole extra op', () => {
    const result = opExtraTransformer({
      ref: RowRefStub({ value: 'session[0:0]' }),
      verb: ExtraVerbNameStub({ value: 'withNestedChain' }),
      args: FieldValuesStub({ depth: 2 }),
    });

    expect(result).toStrictEqual({
      op: 'extra',
      ref: 'session[0:0]',
      verb: 'withNestedChain',
      args: { depth: 2 },
    });
  });
});
