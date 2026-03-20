import { floorGroupContract } from './floor-group-contract';
import { FloorGroupStub } from './floor-group.stub';

describe('floorGroupContract', () => {
  describe('valid floor groups', () => {
    it('VALID: {floorName, floorNumber, workItems} => parses successfully', () => {
      const group = FloorGroupStub({
        floorName: 'FORGE',
        floorNumber: 1,
      });

      const result = floorGroupContract.parse(group);

      expect(result.floorName).toBe('FORGE');
      expect(result.floorNumber).toBe(1);
    });

    it('VALID: {floorNumber: null} => parses entrance-type floor', () => {
      const group = FloorGroupStub({ floorNumber: null });

      const result = floorGroupContract.parse(group);

      expect(result.floorNumber).toBeNull();
    });
  });
});
