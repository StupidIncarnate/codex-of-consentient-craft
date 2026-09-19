import { corruptSchemaArgsContract } from './corrupt-schema-args-contract';
import { CorruptSchemaArgsStub } from './corrupt-schema-args.stub';

describe('corruptSchemaArgsContract', () => {
  describe('valid corrupt schema args', () => {
    it('VALID: {} => parses to an empty object', () => {
      const result = corruptSchemaArgsContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {extra: "ignored"} => strips the unknown key', () => {
      const result = corruptSchemaArgsContract.parse({ extra: 'ignored' });

      expect(result).toStrictEqual({});
    });

    it('VALID: CorruptSchemaArgsStub() => returns an empty object', () => {
      const result = CorruptSchemaArgsStub();

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid corrupt schema args', () => {
    it('INVALID: {value: "not-an-object"} => throws "Expected object, received string"', () => {
      expect(() => corruptSchemaArgsContract.parse('not-an-object' as never)).toThrow(
        /Expected object, received string/u,
      );
    });
  });
});
