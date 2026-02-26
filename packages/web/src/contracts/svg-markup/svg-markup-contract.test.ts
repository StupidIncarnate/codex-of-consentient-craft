import { svgMarkupContract } from './svg-markup-contract';
import { SvgMarkupStub } from './svg-markup.stub';

describe('svgMarkupContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "<svg>...</svg>"} => parses svg markup', () => {
      const result = svgMarkupContract.parse('<svg><rect /></svg>');

      expect(result).toBe('<svg><rect /></svg>');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => svgMarkupContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => svgMarkupContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid svg markup', () => {
      const result = SvgMarkupStub();

      expect(result).toBe('<svg><text>stub diagram</text></svg>');
    });

    it('VALID: {value: "<svg>custom</svg>"} => creates markup with custom value', () => {
      const result = SvgMarkupStub({ value: '<svg>custom</svg>' });

      expect(result).toBe('<svg>custom</svg>');
    });
  });
});
