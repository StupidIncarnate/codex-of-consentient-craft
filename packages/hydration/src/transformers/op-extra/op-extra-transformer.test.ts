import { opExtraTransformer } from './op-extra-transformer';
import { FieldValuesStub } from '../../contracts/field-values/field-values.stub';

describe('opExtraTransformer', () => {
  it('VALID: {ref: session[0:0], verb: withNestedChain, args: {depth: 2}} => returns the whole extra op', () => {
    const result = opExtraTransformer({
      ref: 'session[0:0]',
      verb: 'withNestedChain',
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
