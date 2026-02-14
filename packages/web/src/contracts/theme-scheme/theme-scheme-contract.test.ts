import { themeSchemeContract } from './theme-scheme-contract';
import { ThemeSchemeStub } from './theme-scheme.stub';

describe('themeSchemeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full ember depths scheme} => parses successfully', () => {
      const result = ThemeSchemeStub();

      const parsed = themeSchemeContract.parse(result);

      expect(parsed).toStrictEqual({
        name: 'Ember Depths',
        desc: 'Dark volcanic caverns with ember accents',
        colors: {
          'bg-deep': '#1a0a2e',
          'bg-surface': '#2d1b4e',
          'bg-raised': '#3d2b5e',
          border: '#4a3866',
          text: '#e8e0f0',
          'text-dim': '#8b7fa8',
          primary: '#ff4500',
          success: '#00c853',
          warning: '#ffd600',
          danger: '#ff1744',
          'loot-gold': '#ffd700',
          'loot-rare': '#bb86fc',
        },
      });
    });

    it('VALID: {partial colors} => parses with subset of color tokens', () => {
      const result = ThemeSchemeStub({
        colors: {
          primary: '#ff4500' as never,
        },
      });

      const parsed = themeSchemeContract.parse(result);

      expect(parsed).toStrictEqual({
        name: 'Ember Depths',
        desc: 'Dark volcanic caverns with ember accents',
        colors: {
          primary: '#ff4500',
        },
      });
    });

    it('EMPTY: {empty colors} => parses with no color tokens', () => {
      const result = ThemeSchemeStub({ colors: {} });

      const parsed = themeSchemeContract.parse(result);

      expect(parsed).toStrictEqual({
        name: 'Ember Depths',
        desc: 'Dark volcanic caverns with ember accents',
        colors: {},
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_NAME: {missing name} => throws validation error', () => {
      expect(() => {
        themeSchemeContract.parse({ desc: 'A theme', colors: {} });
      }).toThrow(/Required/u);
    });

    it('INVALID_DESC: {missing desc} => throws validation error', () => {
      expect(() => {
        themeSchemeContract.parse({ name: 'Test', colors: {} });
      }).toThrow(/Required/u);
    });

    it('INVALID_COLORS: {missing colors} => throws validation error', () => {
      expect(() => {
        themeSchemeContract.parse({ name: 'Test', desc: 'A theme' });
      }).toThrow(/Required/u);
    });

    it('INVALID_COLORS: {invalid color token key} => throws validation error', () => {
      expect(() => {
        themeSchemeContract.parse({
          name: 'Test',
          desc: 'A theme',
          colors: { 'invalid-token': '#ff4500' },
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_COLORS: {invalid hex value} => throws validation error', () => {
      expect(() => {
        themeSchemeContract.parse({
          name: 'Test',
          desc: 'A theme',
          colors: { primary: 'not-a-color' },
        });
      }).toThrow(/Must be a valid hex color/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid theme scheme', () => {
      const result = ThemeSchemeStub();

      expect(result.name).toBe('Ember Depths');
      expect(result.desc).toBe('Dark volcanic caverns with ember accents');
      expect(result.colors).toStrictEqual({
        'bg-deep': '#1a0a2e',
        'bg-surface': '#2d1b4e',
        'bg-raised': '#3d2b5e',
        border: '#4a3866',
        text: '#e8e0f0',
        'text-dim': '#8b7fa8',
        primary: '#ff4500',
        success: '#00c853',
        warning: '#ffd600',
        danger: '#ff1744',
        'loot-gold': '#ffd700',
        'loot-rare': '#bb86fc',
      });
    });
  });
});
