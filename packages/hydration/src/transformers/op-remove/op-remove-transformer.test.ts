import { opRemoveTransformer } from './op-remove-transformer';

describe('opRemoveTransformer', () => {
  it('VALID: {ref: guild[0:0]/quest[0:1]} => returns the whole remove op', () => {
    const result = opRemoveTransformer({ ref: 'guild[0:0]/quest[0:1]' });

    expect(result).toStrictEqual({ op: 'remove', ref: 'guild[0:0]/quest[0:1]' });
  });
});
