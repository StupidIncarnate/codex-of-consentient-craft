import { envRecordContract } from './env-record-contract';
import { EnvRecordStub } from './env-record.stub';

describe('envRecordContract', () => {
  describe('valid env records', () => {
    it('VALID: {value: {PATH: "/usr/bin"}} => parses simple env', () => {
      const env = EnvRecordStub({ value: { PATH: '/usr/bin' } });

      const result = envRecordContract.parse(env);

      expect(result).toStrictEqual({ PATH: '/usr/bin' });
    });

    it('VALID: {value: {}} => parses empty env', () => {
      const env = EnvRecordStub({ value: {} });

      const result = envRecordContract.parse(env);

      expect(result).toStrictEqual({});
    });

    it('VALID: {value: {UNDEFINED_VAR: undefined}} => parses env with undefined value', () => {
      const env = EnvRecordStub({ value: { UNDEFINED_VAR: undefined } });

      const result = envRecordContract.parse(env);

      expect(result).toStrictEqual({ UNDEFINED_VAR: undefined });
    });
  });

  describe('invalid env records', () => {
    it('INVALID_ENV_RECORD: {value: "not-an-object"} => throws validation error', () => {
      expect(() => {
        return envRecordContract.parse('not-an-object' as never);
      }).toThrow(/object/iu);
    });

    it('INVALID_ENV_RECORD: {value: {key: 123}} => throws validation error for numeric value', () => {
      expect(() => {
        return envRecordContract.parse({ key: 123 } as never);
      }).toThrow(/string/iu);
    });
  });
});
