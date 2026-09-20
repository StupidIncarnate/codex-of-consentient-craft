import { linkValuesResultContract } from './link-values-result-contract';
import { LinkValuesResultStub } from './link-values-result.stub';

describe('linkValuesResultContract', () => {
  describe('every link satisfied', () => {
    it('VALID: {ok: true, values: {guildId: "g1"}} => returns the resolved values', () => {
      const result = linkValuesResultContract.parse(
        LinkValuesResultStub({ ok: true, values: { guildId: 'g1' } }),
      );

      expect(result).toStrictEqual({ ok: true, values: { guildId: 'g1' } });
    });
  });

  describe('a link no ancestor supplies', () => {
    it('VALID: {ok: false, missingParentName: "guild"} => returns the missing parent name', () => {
      const result = linkValuesResultContract.parse(
        LinkValuesResultStub({ ok: false, missingParentName: 'guild' }),
      );

      expect(result).toStrictEqual({ ok: false, missingParentName: 'guild' });
    });
  });

  describe('an unrecognised discriminant', () => {
    it('INVALID: {ok: "maybe"} => throws', () => {
      expect(() => linkValuesResultContract.parse({ ok: 'maybe' })).toThrow(
        /Invalid discriminator value/u,
      );
    });
  });
});
