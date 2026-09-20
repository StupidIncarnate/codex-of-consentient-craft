import { opRemoveTransformer } from './op-remove-transformer';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';

describe('opRemoveTransformer', () => {
  it('VALID: {ref: guild[0:0]/quest[0:1]} => returns the whole remove op', () => {
    const result = opRemoveTransformer({ ref: RowRefStub({ value: 'guild[0:0]/quest[0:1]' }) });

    expect(result).toStrictEqual({ op: 'remove', ref: 'guild[0:0]/quest[0:1]' });
  });
});
