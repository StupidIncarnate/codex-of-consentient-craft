import { wardConfigContract } from './ward-config-contract';
import { WardConfigStub } from './ward-config.stub';

describe('wardConfigContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = wardConfigContract.parse(
        WardConfigStub({ only: ['lint', 'test'], glob: 'src/**', changed: true, verbose: true }),
      );

      expect(result).toStrictEqual({
        only: ['lint', 'test'],
        glob: 'src/**',
        changed: true,
        verbose: true,
      });
    });

    it('VALID: {empty object} => parses with all optional fields omitted', () => {
      const result = wardConfigContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {only verbose} => parses single field', () => {
      const result = wardConfigContract.parse({ verbose: false });

      expect(result).toStrictEqual({ verbose: false });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_ONLY: {only: ["bad"]} => throws for invalid check type', () => {
      expect(() => wardConfigContract.parse({ only: ['bad'] })).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VERBOSE: {verbose: "yes"} => throws for non-boolean', () => {
      expect(() => wardConfigContract.parse({ verbose: 'yes' })).toThrow(/Expected boolean/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid ward config', () => {
      const result = WardConfigStub();

      expect(result).toStrictEqual({});
    });

    it('VALID: {custom values} => creates ward config with overrides', () => {
      const result = WardConfigStub({ only: ['e2e'], verbose: true });

      expect(result).toStrictEqual({
        only: ['e2e'],
        verbose: true,
      });
    });
  });
});
