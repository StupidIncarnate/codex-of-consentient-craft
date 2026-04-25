import { shouldRetainLocationLiteralGuard } from './should-retain-location-literal-guard';

describe('shouldRetainLocationLiteralGuard', () => {
  describe('empty / undefined input', () => {
    it('EMPTY: {} => returns false', () => {
      expect(shouldRetainLocationLiteralGuard({})).toBe(false);
    });

    it('EMPTY: {literal: ""} => returns false', () => {
      expect(shouldRetainLocationLiteralGuard({ literal: '', minRetainedLength: 8 })).toBe(false);
    });
  });

  describe('literals containing "." (always retained)', () => {
    it('VALID: ".mcp.json" => returns true regardless of length', () => {
      expect(shouldRetainLocationLiteralGuard({ literal: '.mcp.json', minRetainedLength: 8 })).toBe(
        true,
      );
    });

    it('VALID: "guild.json" => returns true even when below the length threshold via dot containment', () => {
      expect(
        shouldRetainLocationLiteralGuard({ literal: 'guild.json', minRetainedLength: 100 }),
      ).toBe(true);
    });
  });

  describe('literals containing "/" (always retained)', () => {
    it('VALID: "node_modules/.bin" => returns true', () => {
      expect(
        shouldRetainLocationLiteralGuard({
          literal: 'node_modules/.bin',
          minRetainedLength: 8,
        }),
      ).toBe(true);
    });
  });

  describe('plain words (filtered by length)', () => {
    it('EDGE: "design" (length 6) with threshold 8 => returns false', () => {
      expect(shouldRetainLocationLiteralGuard({ literal: 'design', minRetainedLength: 8 })).toBe(
        false,
      );
    });

    it('EDGE: "subagents" (length 9) with threshold 8 => returns true', () => {
      expect(shouldRetainLocationLiteralGuard({ literal: 'subagents', minRetainedLength: 8 })).toBe(
        true,
      );
    });

    it('EDGE: "guilds" (length 6) with threshold 8 => returns false', () => {
      expect(shouldRetainLocationLiteralGuard({ literal: 'guilds', minRetainedLength: 8 })).toBe(
        false,
      );
    });

    it('EMPTY: plain word but minRetainedLength undefined => returns false', () => {
      expect(shouldRetainLocationLiteralGuard({ literal: 'subagents' })).toBe(false);
    });
  });
});
