import { SpecNameStub } from '../spec-name/spec-name.stub';
import { capacityArgsContract } from './capacity-args-contract';
import { CapacityArgsStub } from './capacity-args.stub';

describe('capacityArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {default stub} => parses with specName, poolSize null, and isJson false', () => {
      const result = capacityArgsContract.parse(CapacityArgsStub());

      expect(result).toStrictEqual({
        specName: 'dungeonmaster-stack',
        poolSize: null,
        isJson: false,
      });
    });

    it('VALID: {specName, poolSize: 3} => parses both through with default isJson false', () => {
      const result = capacityArgsContract.parse(
        CapacityArgsStub({ specName: SpecNameStub({ value: 'dungeonmaster-api' }), poolSize: 3 }),
      );

      expect(result).toStrictEqual({ specName: 'dungeonmaster-api', poolSize: 3, isJson: false });
    });

    it('VALID: {specName, poolSize: 3, isJson: true} => parses all three fields', () => {
      const result = capacityArgsContract.parse(
        CapacityArgsStub({
          specName: SpecNameStub({ value: 'dungeonmaster-api' }),
          poolSize: 3,
          isJson: true,
        }),
      );

      expect(result).toStrictEqual({ specName: 'dungeonmaster-api', poolSize: 3, isJson: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {specName: null} => throws, specName is required', () => {
      expect(() => CapacityArgsStub({ specName: null as never })).toThrow(/expected string/iu);
    });

    it('INVALID: {poolSize: 0} => throws, a pool the caller is about to open holds at least one', () => {
      expect(() => CapacityArgsStub({ poolSize: 0 })).toThrow(/greater than 0/iu);
    });

    it('INVALID: {an extra key} => throws, the args block is strict', () => {
      expect(() => CapacityArgsStub({ extra: false } as never)).toThrow(/unrecognized key/iu);
    });
  });
});
