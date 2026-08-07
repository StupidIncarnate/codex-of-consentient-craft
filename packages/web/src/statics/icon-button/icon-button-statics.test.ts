import { iconButtonStatics } from './icon-button-statics';

describe('iconButtonStatics', () => {
  describe('sizes', () => {
    it('VALID: {sizes} => names exactly the two Mantine members the app is allowed to use', () => {
      // 20px ties between xs (18) and sm (22) and 32px sits nearer lg (34) than md (28) — this pair
      // is where that judgement is made, so it is asserted whole rather than per key.
      expect(iconButtonStatics.sizes).toStrictEqual({ small: 'sm', large: 'lg' });
    });
  });

  describe('glyphPx', () => {
    it('VALID: {glyphPx} => carries a glyph size for every member of the Mantine scale', () => {
      // Every member is present so a call site picking any size gets a sized glyph rather than an
      // undefined that silently falls back to tabler's own 24px default. Each value stays under
      // Mantine's painted box for that member (sm 22px, lg 34px) so no glyph touches its border.
      expect(iconButtonStatics.glyphPx).toStrictEqual({ xs: 12, sm: 14, md: 18, lg: 20, xl: 26 });
    });
  });

  describe('borderRadiusPx', () => {
    it('VALID: {borderRadiusPx} => is the near-square corner PixelBtnWidget uses', () => {
      expect(iconButtonStatics.borderRadiusPx).toBe(2);
    });
  });
});
