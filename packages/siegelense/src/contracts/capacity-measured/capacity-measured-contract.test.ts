import { capacityMeasuredContract } from './capacity-measured-contract';
import { CapacityMeasuredStub } from './capacity-measured.stub';

describe('capacityMeasuredContract', () => {
  describe('a measured host', () => {
    it("VALID: {the spec's own worked figures} => parses every field through", () => {
      const measured = CapacityMeasuredStub({
        freeMemMB: 5320,
        cores: 8,
        loadAvg1: 4.2,
        siegeInstances: 1,
        diskFreeMB: 41_000,
      });

      const result = capacityMeasuredContract.parse(measured);

      expect(result).toStrictEqual({
        freeMemMB: 5320,
        cores: 8,
        loadAvg1: 4.2,
        siegeInstances: 1,
        diskFreeMB: 41_000,
      });
    });

    it('EMPTY: {siegeInstances: 0, loadAvg1: 0} => parses, because an idle machine is a real reading', () => {
      const result = capacityMeasuredContract.parse(
        CapacityMeasuredStub({ siegeInstances: 0, loadAvg1: 0 }),
      );

      expect(result).toStrictEqual({
        freeMemMB: 5320,
        cores: 8,
        loadAvg1: 0,
        siegeInstances: 0,
        diskFreeMB: 41_000,
      });
    });
  });

  describe('an unmeasurable filesystem', () => {
    it('EMPTY: {diskFreeMB: null} => parses, keeping "not measured" apart from zero', () => {
      const result = capacityMeasuredContract.parse(CapacityMeasuredStub({ diskFreeMB: null }));

      expect(result).toStrictEqual({
        freeMemMB: 5320,
        cores: 8,
        loadAvg1: 4.2,
        siegeInstances: 1,
        diskFreeMB: null,
      });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {loadAvg1: -1} => throws, a load average is never negative', () => {
      expect(() => CapacityMeasuredStub({ loadAvg1: -1 })).toThrow(/greater than or equal to 0/iu);
    });

    it('INVALID: {freeMemMB: 1.5} => throws, megabytes are whole', () => {
      expect(() => CapacityMeasuredStub({ freeMemMB: 1.5 })).toThrow(/integer/iu);
    });

    it('INVALID: {an extra totalMemMB key} => throws, the block is strict', () => {
      expect(() => CapacityMeasuredStub({ totalMemMB: 16_000 } as never)).toThrow(
        /unrecognized key/iu,
      );
    });
  });
});
