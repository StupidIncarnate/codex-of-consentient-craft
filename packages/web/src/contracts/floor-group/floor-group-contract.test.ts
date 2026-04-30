import { floorGroupContract } from './floor-group-contract';
import { FloorGroupStub } from './floor-group.stub';

describe('floorGroupContract', () => {
  describe('valid floor groups', () => {
    it('VALID: {key, floorName, floorNumber, workItems} => parses successfully', () => {
      const group = FloorGroupStub({
        floorName: 'FORGE',
        floorNumber: 1,
      });

      const result = floorGroupContract.parse(group);

      expect(result).toStrictEqual({
        key: '1:FORGE',
        floorName: 'FORGE',
        floorNumber: 1,
        workItems: [],
      });
    });

    it('VALID: {floorNumber: null} => parses entrance-type floor', () => {
      const group = FloorGroupStub({ floorNumber: null });

      const result = floorGroupContract.parse(group);

      expect(result.floorNumber).toBe(null);
    });
  });
});
