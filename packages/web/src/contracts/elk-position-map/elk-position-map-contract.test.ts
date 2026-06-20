import { elkPositionMapContract } from './elk-position-map-contract';
import { ElkPositionMapStub } from './elk-position-map.stub';

describe('elkPositionMapContract', () => {
  describe('valid inputs', () => {
    it('VALID: {single node entry} => parses successfully', () => {
      const result = elkPositionMapContract.parse({ 'my-node': { x: 10, y: 20 } });

      expect(result).toStrictEqual({ 'my-node': { x: 10, y: 20 } });
    });

    it('VALID: {multiple node entries} => parses all entries', () => {
      const result = elkPositionMapContract.parse({
        'node-a': { x: 0, y: 0 },
        'node-b': { x: 180, y: 60 },
      });

      expect(result).toStrictEqual({
        'node-a': { x: 0, y: 0 },
        'node-b': { x: 180, y: 60 },
      });
    });

    it('EMPTY: {} => parses empty map', () => {
      const result = elkPositionMapContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: stub default => produces login-page entry', () => {
      const result = ElkPositionMapStub();

      expect(result).toStrictEqual({ 'login-page': { x: 0, y: 0 } });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {entry missing x} => throws validation error', () => {
      expect(() => {
        elkPositionMapContract.parse({ 'bad-node': { y: 10 } });
      }).toThrow(/Required/u);
    });

    it('INVALID: {x is string} => throws validation error', () => {
      expect(() => {
        elkPositionMapContract.parse({ 'bad-node': { x: 'not-a-number', y: 10 } });
      }).toThrow(/Expected number/u);
    });
  });
});
