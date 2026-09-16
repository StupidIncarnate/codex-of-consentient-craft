import { wardResultDetailArgsContract } from './ward-result-detail-args-contract';
import { WardResultDetailArgsStub } from './ward-result-detail-args.stub';

describe('wardResultDetailArgsContract', () => {
  describe('valid ward result detail args', () => {
    it('VALID: {wardResultId, detail} => parses to exactly those two fields', () => {
      const result = wardResultDetailArgsContract.parse({
        wardResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        detail: { testFailures: [] },
      });

      expect(result).toStrictEqual({
        wardResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        detail: { testFailures: [] },
      });
    });

    it('VALID: {stub with detail override} => parses with the overridden blob', () => {
      const result = WardResultDetailArgsStub({ detail: { exitCode: 1 } });

      expect(result.detail).toStrictEqual({ exitCode: 1 });
    });
  });

  describe('invalid ward result detail args', () => {
    it('INVALID: {detail only} => throws "Required"', () => {
      expect(() => wardResultDetailArgsContract.parse({ detail: {} })).toThrow(/Required/u);
    });

    it('INVALID: {wardResultId: "not-a-uuid"} => throws "Invalid uuid"', () => {
      expect(() =>
        wardResultDetailArgsContract.parse({ wardResultId: 'not-a-uuid', detail: {} }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {detail: "not-an-object"} => throws "Expected object, received string"', () => {
      expect(() =>
        wardResultDetailArgsContract.parse({
          wardResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          detail: 'not-an-object',
        }),
      ).toThrow(/Expected object, received string/u);
    });
  });

  describe('empty ward result detail args', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => wardResultDetailArgsContract.parse({})).toThrow(/Required/u);
    });
  });
});
