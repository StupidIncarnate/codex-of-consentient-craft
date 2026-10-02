import { loadCapacitySuggestionContract } from './load-capacity-suggestion-contract';
import { LoadCapacitySuggestionStub } from './load-capacity-suggestion.stub';

describe('loadCapacitySuggestionContract', () => {
  describe('valid suggestions', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const suggestion = LoadCapacitySuggestionStub();

      const result = loadCapacitySuggestionContract.parse(suggestion);

      expect(result).toStrictEqual({
        suggestion: 4,
        cpuLimit: 4,
        freeMemoryLimit: 8,
        capMemoryLimit: 6,
      });
    });

    it('VALID: {freeMemoryLimit: null, capMemoryLimit: null} => parses successfully', () => {
      const suggestion = LoadCapacitySuggestionStub({
        suggestion: 2,
        cpuLimit: 2,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });

      const result = loadCapacitySuggestionContract.parse(suggestion);

      expect(result).toStrictEqual({
        suggestion: 2,
        cpuLimit: 2,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      });
    });

    it('VALID: {zero values} => parses successfully', () => {
      const suggestion = LoadCapacitySuggestionStub({
        suggestion: 0,
        cpuLimit: 0,
        freeMemoryLimit: 0,
        capMemoryLimit: 0,
      });

      const result = loadCapacitySuggestionContract.parse(suggestion);

      expect(result).toStrictEqual({
        suggestion: 0,
        cpuLimit: 0,
        freeMemoryLimit: 0,
        capMemoryLimit: 0,
      });
    });
  });

  describe('invalid suggestions', () => {
    it('INVALID: {} => throws validation error on missing required fields', () => {
      expect(() => {
        loadCapacitySuggestionContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {suggestion: -1} => throws on negative suggestion', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          suggestion: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {suggestion: 1.5} => throws on non-integer suggestion', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          suggestion: 1.5 as never,
        });
      }).toThrow(/int/u);
    });

    it('INVALID: {cpuLimit: -1} => throws on negative cpuLimit', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          cpuLimit: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {cpuLimit: 2.2} => throws on non-integer cpuLimit', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          cpuLimit: 2.2 as never,
        });
      }).toThrow(/int/u);
    });

    it('INVALID: {freeMemoryLimit: -1} => throws on negative freeMemoryLimit', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          freeMemoryLimit: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {freeMemoryLimit: 3.7} => throws on non-integer freeMemoryLimit', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          freeMemoryLimit: 3.7 as never,
        });
      }).toThrow(/int/u);
    });

    it('INVALID: {capMemoryLimit: -1} => throws on negative capMemoryLimit', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          capMemoryLimit: -1 as never,
        });
      }).toThrow(/>=0/u);
    });

    it('INVALID: {capMemoryLimit: 5.5} => throws on non-integer capMemoryLimit', () => {
      const suggestion = LoadCapacitySuggestionStub();

      expect(() => {
        loadCapacitySuggestionContract.parse({
          ...suggestion,
          capMemoryLimit: 5.5 as never,
        });
      }).toThrow(/int/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid default load capacity suggestion', () => {
      const result = LoadCapacitySuggestionStub();

      expect(result).toStrictEqual({
        suggestion: 4,
        cpuLimit: 4,
        freeMemoryLimit: 8,
        capMemoryLimit: 6,
      });
    });

    it('VALID: {custom overrides} => creates load capacity suggestion with overridden fields', () => {
      const result = LoadCapacitySuggestionStub({
        suggestion: 1,
        cpuLimit: 1,
      });

      expect(result).toStrictEqual({
        suggestion: 1,
        cpuLimit: 1,
        freeMemoryLimit: 8,
        capMemoryLimit: 6,
      });
    });
  });
});
