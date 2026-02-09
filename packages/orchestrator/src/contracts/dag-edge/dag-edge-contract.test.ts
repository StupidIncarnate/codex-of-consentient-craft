import { dagEdgeContract } from './dag-edge-contract';
import { DagEdgeStub } from './dag-edge.stub';

describe('dagEdgeContract', () => {
  describe('valid edges', () => {
    it('VALID: {id, empty dependsOn} => parses successfully', () => {
      const edge = DagEdgeStub();

      const result = dagEdgeContract.parse(edge);

      expect(result).toStrictEqual({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        dependsOn: [],
      });
    });

    it('VALID: {id, dependsOn with entries} => parses successfully', () => {
      const edge = DagEdgeStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        dependsOn: ['e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b'],
      });

      const result = dagEdgeContract.parse(edge);

      expect(result).toStrictEqual({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        dependsOn: ['e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b'],
      });
    });
  });

  describe('invalid edges', () => {
    it('INVALID_ID: {id: ""} => throws validation error', () => {
      expect(() => {
        return dagEdgeContract.parse({ id: '', dependsOn: [] });
      }).toThrow(/too_small/u);
    });

    it('INVALID_MULTIPLE: {missing fields} => throws validation error', () => {
      expect(() => {
        return dagEdgeContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
