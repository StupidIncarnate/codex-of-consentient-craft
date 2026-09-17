import { capacityArgsContract } from './capacity-args-contract';
import { CapacityArgsStub } from './capacity-args.stub';

describe('capacityArgsContract', () => {
  describe('the bare form', () => {
    it('EMPTY: {no flags} => parses both fields as null, so the broker reads its knobs', () => {
      const result = capacityArgsContract.parse(CapacityArgsStub());

      expect(result).toStrictEqual({ specName: null, poolSize: null });
    });
  });

  describe('both flags named', () => {
    it('VALID: {specName, poolSize: 3} => parses both through', () => {
      const result = capacityArgsContract.parse(
        CapacityArgsStub({ specName: 'dungeonmaster-headless', poolSize: 3 }),
      );

      expect(result).toStrictEqual({ specName: 'dungeonmaster-headless', poolSize: 3 });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {poolSize: 0} => throws, a pool the caller is about to open holds at least one', () => {
      expect(() => CapacityArgsStub({ poolSize: 0 })).toThrow(/greater than 0/iu);
    });

    it('INVALID: {an extra human key} => throws, the args block is strict', () => {
      expect(() => CapacityArgsStub({ human: false } as never)).toThrow(/unrecognized key/iu);
    });
  });
});
