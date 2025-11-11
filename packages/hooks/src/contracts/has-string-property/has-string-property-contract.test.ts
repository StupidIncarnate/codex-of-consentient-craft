import { hasStringPropertyContract } from './has-string-property-contract';
import { hasStringPropertyContract as _hasStringPropertyStub } from './has-string-property.stub';

describe('hasStringPropertyContract()', () => {
  describe('valid inputs', () => {
    it('VALID: {obj: {name: "test"}, property: "name"} => returns true', () => {
      const result = hasStringPropertyContract({ obj: { name: 'test' }, property: 'name' });

      expect(result).toBe(true);
    });

    it('VALID: {obj: {id: "123", value: "abc"}, property: "value"} => returns true', () => {
      const result = hasStringPropertyContract({
        obj: { id: '123', value: 'abc' },
        property: 'value',
      });

      expect(result).toBe(true);
    });

    it('VALID: {obj: {empty: ""}, property: "empty"} => returns true for empty string', () => {
      const result = hasStringPropertyContract({ obj: { empty: '' }, property: 'empty' });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {obj: {count: 42}, property: "count"} => returns false for number', () => {
      const result = hasStringPropertyContract({ obj: { count: 42 }, property: 'count' });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: {flag: true}, property: "flag"} => returns false for boolean', () => {
      const result = hasStringPropertyContract({ obj: { flag: true }, property: 'flag' });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: {data: null}, property: "data"} => returns false for null', () => {
      const result = hasStringPropertyContract({ obj: { data: null }, property: 'data' });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: {}, property: "missing"} => returns false for missing property', () => {
      const result = hasStringPropertyContract({ obj: {}, property: 'missing' });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: null, property: "any"} => returns false for null object', () => {
      const result = hasStringPropertyContract({ obj: null, property: 'any' });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: undefined, property: "any"} => returns false for undefined object', () => {
      const result = hasStringPropertyContract({ obj: undefined, property: 'any' });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: "string", property: "length"} => returns false for non-object', () => {
      const result = hasStringPropertyContract({ obj: 'string', property: 'length' });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: 123, property: "toString"} => returns false for number', () => {
      const result = hasStringPropertyContract({ obj: 123, property: 'toString' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {obj: {nested: {value: "test"}}, property: "nested"} => returns false for object value', () => {
      const result = hasStringPropertyContract({
        obj: { nested: { value: 'test' } },
        property: 'nested',
      });

      expect(result).toBe(false);
    });

    it('EDGE: {obj: {arr: ["a", "b"]}, property: "arr"} => returns false for array value', () => {
      const result = hasStringPropertyContract({ obj: { arr: ['a', 'b'] }, property: 'arr' });

      expect(result).toBe(false);
    });

    it('EDGE: {obj: {fn: () => "test"}, property: "fn"} => returns false for function value', () => {
      const result = hasStringPropertyContract({
        obj: {
          fn: () => {
            return 'test';
          },
        },
        property: 'fn',
      });

      expect(result).toBe(false);
    });
  });
});
