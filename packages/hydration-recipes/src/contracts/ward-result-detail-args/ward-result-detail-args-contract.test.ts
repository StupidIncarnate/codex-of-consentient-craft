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
    it('INVALID: {detail only} => throws "received undefined"', () => {
      expect(() => wardResultDetailArgsContract.parse({ detail: {} })).toThrow(
        /received undefined/u,
      );
    });

    it('INVALID: {wardResultId: "not-a-uuid"} => throws "Invalid UUID"', () => {
      expect(() =>
        wardResultDetailArgsContract.parse({ wardResultId: 'not-a-uuid', detail: {} }),
      ).toThrow(/Invalid UUID/u);
    });

    it('INVALID: {detail: "not-an-object"} => throws "Expected object, received string"', () => {
      expect(() =>
        wardResultDetailArgsContract.parse({
          wardResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          detail: 'not-an-object',
        }),
      ).toThrow(/Invalid input: expected record, received string/u);
    });
  });

  describe('empty ward result detail args', () => {
    it('EMPTY: {} => throws "received undefined"', () => {
      expect(() => wardResultDetailArgsContract.parse({})).toThrow(/received undefined/u);
    });
  });
});
