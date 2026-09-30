import { logoStatics } from './logo-statics';

describe('logoStatics', () => {
  describe('breakpoints', () => {
    it('VALID: {} => sprites hide first, then the art steps down twice, at narrowing widths', () => {
      expect(logoStatics.breakpoints).toStrictEqual({
        hideSpritesMaxPx: 619,
        smallAsciiMaxPx: 519,
        tinyAsciiMaxPx: 419,
      });
    });
  });

  describe('fontSizes', () => {
    it('VALID: {} => the two stepped-down art sizes are below the 7px default', () => {
      expect(logoStatics.fontSizes).toStrictEqual({ smallAsciiPx: 5, tinyAsciiPx: 4 });
    });
  });
});
