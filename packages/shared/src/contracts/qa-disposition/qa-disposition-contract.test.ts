import { qaDispositionContract } from './qa-disposition-contract';
import { QaDispositionStub } from './qa-disposition.stub';

describe('qaDispositionContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the six dispositions', () => {
      expect(qaDispositionContract.options).toStrictEqual([
        'walked',
        'fixed',
        'routed',
        'recorded',
        'gap',
        'unconfirmed',
      ]);
    });

    it.each(qaDispositionContract.options)(
      'VALID: {disposition: %s} => parses to itself, so every member can clear the completion gate',
      (disposition) => {
        expect(QaDispositionStub({ value: disposition })).toBe(disposition);
      },
    );
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to walked', () => {
      expect(QaDispositionStub()).toBe('walked');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {disposition: "pending"} => throws, because an un-dispositioned unit has no entry at all', () => {
      expect(() => QaDispositionStub({ value: 'pending' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {disposition: ""} => throws', () => {
      expect(() => QaDispositionStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
