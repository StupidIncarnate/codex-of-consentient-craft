import { opRemoveContract } from './op-remove-contract';
import { OpRemoveStub } from './op-remove.stub';

describe('opRemoveContract', () => {
  describe('valid remove ops', () => {
    it('VALID: {ref: "guild[0:0]/quest[0:1]"} => returns {op: "remove", ref: "guild[0:0]/quest[0:1]"}', () => {
      expect(OpRemoveStub({ ref: 'guild[0:0]/quest[0:1]' })).toStrictEqual({
        op: 'remove',
        ref: 'guild[0:0]/quest[0:1]',
      });
    });
  });

  describe('invalid remove ops', () => {
    it('INVALID: {no ref} => throws "received undefined"', () => {
      expect(() => opRemoveContract.parse({ op: 'remove' })).toThrow(/received undefined/u);
    });

    it('INVALID: {op: "nope"} => throws naming the expected literal', () => {
      expect(() =>
        opRemoveContract.parse({ op: 'nope' as never, ref: 'guild[0:0]/quest[0:1]' }),
      ).toThrow(/Invalid input: expected/u);
    });
  });
});
