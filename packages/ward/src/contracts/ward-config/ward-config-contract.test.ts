import { wardConfigContract } from './ward-config-contract';
import { WardConfigStub } from './ward-config.stub';

describe('wardConfigContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = wardConfigContract.parse(
        WardConfigStub({
          only: ['lint', 'unit'],
          onlyTests: 'my test',
          committed: true,
        }),
      );

      expect(result).toStrictEqual({
        only: ['lint', 'unit'],
        onlyTests: 'my test',
        committed: true,
      });
    });

    it('VALID: {empty object} => parses with all optional fields omitted', () => {
      const result = wardConfigContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {passthrough with file paths} => parses passthrough array', () => {
      const result = wardConfigContract.parse({
        passthrough: ['packages/ward/src/index.test.ts'],
      });

      expect(result).toStrictEqual({
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });

    it('VALID: {passthrough empty array} => parses empty passthrough', () => {
      const result = wardConfigContract.parse({ passthrough: [] });

      expect(result).toStrictEqual({ passthrough: [] });
    });

    it('VALID: {prune: "default"} => parses prune default mode', () => {
      const result = wardConfigContract.parse({ prune: 'default' });

      expect(result).toStrictEqual({ prune: 'default' });
    });

    it('VALID: {prune: "all"} => parses prune all mode', () => {
      const result = wardConfigContract.parse({ prune: 'all' });

      expect(result).toStrictEqual({ prune: 'all' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {only: ["bad"]} => throws for invalid check type', () => {
      expect(() => wardConfigContract.parse({ only: ['bad'] })).toThrow(/Invalid option/u);
    });

    it('INVALID: {prune: "invalid"} => throws for invalid prune mode', () => {
      expect(() => wardConfigContract.parse({ prune: 'invalid' as unknown as 'default' })).toThrow(
        /Invalid option/u,
      );
    });

    it('VALID: {only: ["e2e"]} => parses e2e check type', () => {
      const result = wardConfigContract.parse({ only: ['e2e'] });

      expect(result).toStrictEqual({ only: ['e2e'] });
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid ward config', () => {
      const result = WardConfigStub();

      expect(result).toStrictEqual({});
    });

    it('VALID: {custom values} => creates ward config with overrides', () => {
      const result = WardConfigStub({ only: ['unit'], committed: true });

      expect(result).toStrictEqual({
        only: ['unit'],
        committed: true,
      });
    });
  });
});
