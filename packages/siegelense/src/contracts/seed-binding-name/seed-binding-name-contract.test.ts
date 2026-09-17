import { seedBindingNameContract } from './seed-binding-name-contract';
import { SeedBindingNameStub } from './seed-binding-name.stub';

describe('seedBindingNameContract', () => {
  describe('valid names', () => {
    it.each(['g', 's', 'seeded', '_g', 'g1'])('VALID: {value: %s} => parses to itself', (value) => {
      expect(SeedBindingNameStub({ value })).toBe(value);
    });
  });

  describe('invalid names', () => {
    it.each(['', '1g', 'g.x', 'g h', 'g-h'])(
      'INVALID: {value: %s} => throws naming the identifier rule',
      (value) => {
        expect(() => seedBindingNameContract.parse(value)).toThrow(
          /A seed binding name is a bare identifier/u,
        );
      },
    );
  });
});
