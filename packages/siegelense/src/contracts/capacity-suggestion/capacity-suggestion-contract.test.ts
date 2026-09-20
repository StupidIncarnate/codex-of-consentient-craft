import { capacitySuggestionContract } from './capacity-suggestion-contract';
import { CapacitySuggestionStub } from './capacity-suggestion.stub';

describe('capacitySuggestionContract', () => {
  describe('a machine with room', () => {
    it("VALID: {the spec's worked example} => parses the arithmetic through", () => {
      const result = capacitySuggestionContract.parse(
        CapacitySuggestionStub({
          suggested: 2,
          ceiling: 3,
          memoryAllows: 2,
          ceilingLeft: 2,
          availableMB: 4808,
        }),
      );

      expect(result).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        memoryAllows: 2,
        ceilingLeft: 2,
        availableMB: 4808,
      });
    });
  });

  describe('a machine with none', () => {
    it('EDGE: {memoryAllows: 0, ceilingLeft: 2} => parses, so the refusal can say memory, not policy', () => {
      const result = capacitySuggestionContract.parse(
        CapacitySuggestionStub({ suggested: 0, memoryAllows: 0, ceilingLeft: 2, availableMB: 0 }),
      );

      expect(result).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        memoryAllows: 0,
        ceilingLeft: 2,
        availableMB: 0,
      });
    });

    it('EDGE: {ceilingLeft: 0, memoryAllows: 2} => parses, so the refusal can say policy, not memory', () => {
      const result = capacitySuggestionContract.parse(
        CapacitySuggestionStub({ suggested: 0, memoryAllows: 2, ceilingLeft: 0 }),
      );

      expect(result).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        memoryAllows: 2,
        ceilingLeft: 0,
        availableMB: 4808,
      });
    });
  });

  describe('invalid arithmetic', () => {
    it('INVALID: {availableMB: -100} => throws, the caller clamps at zero rather than reporting a deficit', () => {
      expect(() => CapacitySuggestionStub({ availableMB: -100 })).toThrow(
        /greater than or equal to 0/iu,
      );
    });

    it('INVALID: {an extra headroomMB key} => throws, the block is strict', () => {
      expect(() => CapacitySuggestionStub({ headroomMB: 512 } as never)).toThrow(
        /unrecognized key/iu,
      );
    });
  });
});
